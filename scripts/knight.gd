extends Node3D
## Knight with combat AI — finds nearest building, runs to it, attacks it.

@export var move_speed: float = 0.5
@export var attack_range: float = 0.15

# LVL 1 stats
var hp: int = 1100
var damage: int = 75
var atk_speed: float = 0.6

# State
enum State { INACTIVE, IDLE, RUNNING, ATTACKING }
var state: State = State.INACTIVE
var target_building: Dictionary = {}
var target_bs = null
var attack_timer: float = 0.0

var anim_player: AnimationPlayer

var anim_files: Array = [
	"res://Model/Characters/Animations/Rig_Medium/Rig_Medium_General.glb",
	"res://Model/Characters/Animations/Rig_Medium/Rig_Medium_MovementBasic.glb",
	"res://Model/Characters/Animations/Rig_Medium/Rig_Medium_CombatMelee.glb",
]


@export var sword_scene: String = "res://Model/Characters/Assets/sword_1handed.gltf"


func _ready() -> void:
	_setup_animations()
	_attach_sword()


func activate() -> void:
	if state != State.INACTIVE:
		return
	state = State.IDLE
	_find_next_target()
	print("Knight activated!")


func _process(delta: float) -> void:
	if state == State.INACTIVE:
		return

	match state:
		State.RUNNING:
			_move_to_target(delta)
		State.ATTACKING:
			_do_attack(delta)


func _setup_animations() -> void:
	anim_player = AnimationPlayer.new()
	anim_player.name = "CombatAnimPlayer"
	add_child(anim_player)
	anim_player.root_node = anim_player.get_path_to(self)

	var lib = AnimationLibrary.new()

	for file_path in anim_files:
		var res = load(file_path)
		if res == null:
			continue
		var instance = res.instantiate()
		add_child(instance)
		_hide_meshes(instance)

		var src = _find_anim_player(instance)
		if src:
			for anim_name in src.get_animation_list():
				if anim_name == "RESET" or anim_name == "T-Pose":
					continue
				var anim = src.get_animation(anim_name)
				if anim and not lib.has_animation(anim_name):
					var dup = anim.duplicate()
					if anim_name.begins_with("Running") or anim_name.begins_with("Walking") or anim_name.begins_with("Idle"):
						dup.loop_mode = Animation.LOOP_LINEAR
					lib.add_animation(anim_name, dup)
		instance.queue_free()

	anim_player.add_animation_library("", lib)

	# Start in idle
	if anim_player.has_animation("Idle_A"):
		anim_player.play("Idle_A")


func _find_next_target() -> void:
	var nearest_dist: float = INF
	var nearest_b: Dictionary = {}
	var nearest_bs_ref = null

	for bs in get_tree().get_nodes_in_group("building_systems"):
		for b in bs.placed_buildings:
			var bhp = b.get("hp", 0)
			if bhp <= 0:
				continue
			if not is_instance_valid(b.node):
				continue
			var bpos = b.node.global_position
			var dist = global_position.distance_to(bpos)
			if dist < nearest_dist:
				nearest_dist = dist
				nearest_b = b
				nearest_bs_ref = bs

	if nearest_b.size() > 0:
		target_building = nearest_b
		target_bs = nearest_bs_ref
		state = State.RUNNING
		if anim_player.has_animation("Running_A"):
			anim_player.play("Running_A")
		print("Knight running to: ", target_building.id)
	else:
		target_building = {}
		target_bs = null
		state = State.IDLE
		if anim_player.has_animation("Idle_A"):
			anim_player.play("Idle_A")
		print("Knight: all buildings destroyed!")


func _move_to_target(delta: float) -> void:
	if target_building.size() == 0 or not is_instance_valid(target_building.node):
		_find_next_target()
		return

	var target_pos = target_building.node.global_position
	target_pos.y = global_position.y
	var diff = target_pos - global_position
	var dist = diff.length()

	if dist > 0.01:
		var dir = diff.normalized()
		look_at(global_position + dir, Vector3.UP)
		rotate_y(PI)

	global_position = global_position.move_toward(
		Vector3(target_pos.x, global_position.y, target_pos.z),
		move_speed * delta
	)

	if dist <= attack_range:
		state = State.ATTACKING
		attack_timer = 0.0
		if anim_player.has_animation("Melee_1H_Attack_Chop"):
			anim_player.play("Melee_1H_Attack_Chop")
		print("Knight attacking: ", target_building.id)


func _do_attack(delta: float) -> void:
	if target_building.size() == 0 or not is_instance_valid(target_building.get("node")):
		_find_next_target()
		return

	attack_timer += delta
	if attack_timer >= atk_speed:
		attack_timer -= atk_speed
		target_building["hp"] = target_building.hp - damage
		print("Knight hit! ", target_building.id, " HP: ", target_building.hp)

		if anim_player.has_animation("Melee_1H_Attack_Chop"):
			anim_player.stop()
			anim_player.play("Melee_1H_Attack_Chop")

		if target_building.hp <= 0:
			_destroy_target()
			_find_next_target()


func _destroy_target() -> void:
	if target_bs and target_bs.has_method("remove_building"):
		target_bs.remove_building(target_building)
	print("Building destroyed!")
	target_building = {}
	target_bs = null


func _attach_sword() -> void:
	var sk = _find_skeleton(self)
	if sk == null:
		push_warning("Knight: Skeleton3D not found")
		return
	var bone_idx = sk.find_bone("handslot.r")
	if bone_idx < 0:
		push_warning("Knight: handslot.r bone not found")
		return
	var ba = BoneAttachment3D.new()
	ba.name = "SwordAttachment"
	ba.bone_name = "handslot.r"
	ba.bone_idx = bone_idx
	sk.add_child(ba)
	var sword_res = load(sword_scene)
	if sword_res:
		var sword = sword_res.instantiate()
		sword.name = "Sword"
		ba.add_child(sword)


func _find_skeleton(node: Node) -> Skeleton3D:
	if node is Skeleton3D:
		return node
	for child in node.get_children():
		var result = _find_skeleton(child)
		if result:
			return result
	return null


func _hide_meshes(node: Node) -> void:
	if node is MeshInstance3D:
		node.visible = false
	for child in node.get_children():
		_hide_meshes(child)


func _find_anim_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer:
		return node
	for child in node.get_children():
		var result = _find_anim_player(child)
		if result:
			return result
	return null
