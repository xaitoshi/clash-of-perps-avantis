extends Node
## Preloads and warms up resources/shaders at startup to avoid
## first-shot lag spikes from on-demand GPU shader compilation.
## Must complete BEFORE clouds reveal — emits warmup_done signal.

signal warmup_done

# All resources that get loaded during gameplay — preload them here
const _PRELOAD_SCENES := [
	"res://Model/Characters/Assets/arrow_bow.gltf",
	"res://Model/Characters/Assets/arrow_crossbow.gltf",
	"res://Model/Characters/Assets/bow_withString.gltf",
	"res://Model/Characters/Assets/crossbow_1handed.gltf",
	"res://assets/BinbunVFX/muzzle_flash/effects/short_flash/short_flash_05.tscn",
	"res://Model/flag/pirate_flag_animated.glb",
	"res://Model/Ship/Sail Ship.glb",
	"res://Model/Characters/Model/Knight.glb",
	"res://Model/Characters/Model/Mage.glb",
	"res://Model/Characters/Model/Barbarian.glb",
	"res://Model/Characters/Model/Ranger.glb",
	"res://Model/Characters/Model/Rogue_Hooded.glb",
]

var _warmup_instances: Array = []
var _frames_rendered: int = 0
var is_done: bool = false


func _ready() -> void:
	# Preload and instantiate everything off-screen so GPU compiles shaders
	for path in _PRELOAD_SCENES:
		var res = load(path)
		if res == null:
			continue
		var instance = res.instantiate()
		# Place far off-screen but visible so GPU renders & compiles shaders
		if instance is Node3D:
			instance.position = Vector3(9999, 9999, 9999)
		add_child(instance)
		_warmup_instances.append(instance)

	# Warm up the HP bar shader
	_warmup_hp_shader()
	# Warm up bullet trail material
	_warmup_trail_material()


func _warmup_hp_shader() -> void:
	var shader_code = "shader_type spatial;
render_mode unshaded, blend_mix, depth_test_disabled, cull_disabled;
uniform vec4 albedo : source_color = vec4(1.0, 1.0, 1.0, 1.0);
uniform vec2 bar_size = vec2(0.12, 0.012);
void fragment() {
	vec2 pos = (UV - 0.5) * bar_size;
	float r = bar_size.y * 0.45;
	vec2 q = abs(pos) - bar_size * 0.5 + r;
	float d = length(max(q, 0.0)) - r;
	float aa = fwidth(d);
	ALBEDO = albedo.rgb;
	ALPHA = albedo.a * (1.0 - smoothstep(-aa, aa, d));
}"
	var shader = Shader.new()
	shader.code = shader_code
	var mat = ShaderMaterial.new()
	mat.shader = shader
	mat.set_shader_parameter("albedo", Color(0.1, 0.85, 0.1, 0.9))
	mat.set_shader_parameter("bar_size", Vector2(0.12, 0.012))

	var mesh_inst = MeshInstance3D.new()
	var quad = QuadMesh.new()
	quad.size = Vector2(0.12, 0.012)
	mesh_inst.mesh = quad
	mesh_inst.material_override = mat
	mesh_inst.position = Vector3(9999, 9999, 9999)
	add_child(mesh_inst)
	_warmup_instances.append(mesh_inst)


func _warmup_trail_material() -> void:
	var trail_mat = StandardMaterial3D.new()
	trail_mat.albedo_color = Color(1.0, 0.88, 0.15, 1.0)
	trail_mat.emission_enabled = true
	trail_mat.emission = Color(1.0, 0.88, 0.15, 1.0)
	trail_mat.emission_energy_multiplier = 6.0
	trail_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	trail_mat.cull_mode = BaseMaterial3D.CULL_DISABLED

	var cyl = CylinderMesh.new()
	cyl.top_radius = 0.004
	cyl.bottom_radius = 0.004
	cyl.height = 0.1

	var mesh_inst = MeshInstance3D.new()
	mesh_inst.mesh = cyl
	mesh_inst.material_override = trail_mat
	mesh_inst.position = Vector3(9999, 9999, 9999)
	add_child(mesh_inst)
	_warmup_instances.append(mesh_inst)


func _process(_delta: float) -> void:
	# Wait several frames so GPU actually processes all shader compilations
	_frames_rendered += 1
	if _frames_rendered >= 5:
		_cleanup()


func _cleanup() -> void:
	for inst in _warmup_instances:
		if is_instance_valid(inst):
			inst.queue_free()
	_warmup_instances.clear()
	is_done = true
	set_process(false)
	warmup_done.emit()
