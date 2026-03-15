extends Node3D
## Attack system: press Attack → click on shipPlane → ship sails to that point.

@export var grid_plane_path: NodePath = "../Island/shipPlane"
@export var ship_scene_path: String = "res://Model/Ship/Sail Ship.glb"
@export var ship_scale: float = 0.15
@export var sail_duration: float = 6.0
@export var spawn_distance: float = 8.0
@export var water_node_path: NodePath = "../Water"

var is_attack_mode: bool = false
var ship_plane: MeshInstance3D
var plane_y: float = 0.0
var water_y: float = 0.0
var plane_center: Vector3 = Vector3.ZERO
var plane_extent_x: float = 0.0
var plane_extent_z: float = 0.0


func _ready() -> void:
	ship_plane = get_node_or_null(grid_plane_path)
	if ship_plane == null:
		push_warning("AttackSystem: shipPlane not found")
		return
	plane_center = ship_plane.global_position
	plane_y = plane_center.y
	plane_extent_x = ship_plane.global_transform.basis.x.length()
	plane_extent_z = ship_plane.global_transform.basis.z.length()
	var water = get_node_or_null(water_node_path)
	if water:
		water_y = water.global_position.y
	print("AttackSystem ready. shipPlane center: ", plane_center, " water_y: ", water_y)


func enter_attack_mode() -> void:
	is_attack_mode = true
	# Activate all troops
	for troop_name in ["Ranger"]:
		var troop = get_tree().current_scene.find_child(troop_name, true, false)
		if troop and troop.has_method("activate"):
			troop.activate()
	print("Attack mode ON - click on shipPlane!")


func exit_attack_mode() -> void:
	is_attack_mode = false


func _input(event: InputEvent) -> void:
	if not is_attack_mode:
		return

	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_LEFT:
			var hit = _get_mouse_hit()
			if hit != Vector3.INF:
				_spawn_ship(hit)
				get_viewport().set_input_as_handled()
				exit_attack_mode()
		elif event.button_index == MOUSE_BUTTON_RIGHT:
			exit_attack_mode()
			get_viewport().set_input_as_handled()


func _get_mouse_hit() -> Vector3:
	if ship_plane == null:
		return Vector3.INF
	var camera = get_viewport().get_camera_3d()
	if camera == null:
		return Vector3.INF
	var mouse = get_viewport().get_mouse_position()
	var from = camera.project_ray_origin(mouse)
	var dir = camera.project_ray_normal(mouse)

	if abs(dir.y) < 0.001:
		return Vector3.INF

	var t = (plane_y - from.y) / dir.y
	if t < 0:
		return Vector3.INF

	var world_hit = from + dir * t

	var offset = world_hit - plane_center
	var pb = ship_plane.global_transform.basis
	var local_x = offset.dot(pb.x.normalized())
	var local_z = offset.dot(pb.z.normalized())

	if abs(local_x) <= plane_extent_x and abs(local_z) <= plane_extent_z:
		return world_hit

	return Vector3.INF


func _spawn_ship(target: Vector3) -> void:
	var ship_res = load(ship_scene_path)
	if ship_res == null:
		push_warning("AttackSystem: Could not load ship: " + ship_scene_path)
		return

	var ship = ship_res.instantiate()
	ship.scale = Vector3(ship_scale, ship_scale, ship_scale)

	# Perpendicular to shipPlane (its Z axis)
	var perp = ship_plane.global_transform.basis.z.normalized()
	perp.y = 0
	perp = perp.normalized()
	# Make sure it points outward (away from island)
	var to_plane = (plane_center - ship_plane.get_parent().global_position).normalized()
	if perp.dot(to_plane) < 0:
		perp = -perp
	# Stop at the edge, spawn far out
	var stop_pos = target
	stop_pos.y = plane_y
	var spawn_pos = stop_pos + perp * spawn_distance
	spawn_pos.y = plane_y

	# Wrap ship in a pivot so we can rock independently of movement
	var pivot = Node3D.new()
	get_tree().current_scene.add_child(pivot)
	pivot.global_position = spawn_pos
	ship.position = Vector3.ZERO
	pivot.add_child(ship)
	pivot.look_at(stop_pos, Vector3.UP)
	pivot.rotate_y(PI)

	# Main movement — slow start, ease into stop
	var tween = create_tween()
	tween.tween_property(pivot, "global_position", stop_pos, sail_duration).set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_CUBIC)

	# Wave rocking — tilt side to side
	var rock_tween = create_tween().set_loops()
	rock_tween.tween_property(ship, "rotation:z", deg_to_rad(3.0), 0.8).set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)
	rock_tween.tween_property(ship, "rotation:z", deg_to_rad(-3.0), 0.8).set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)

	# Bobbing up and down
	var bob_tween = create_tween().set_loops()
	bob_tween.tween_property(ship, "position:y", 0.05, 0.6).set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)
	bob_tween.tween_property(ship, "position:y", -0.05, 0.6).set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)

	# Slight pitch forward
	var pitch_tween = create_tween().set_loops()
	pitch_tween.tween_property(ship, "rotation:x", deg_to_rad(2.0), 1.0).set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)
	pitch_tween.tween_property(ship, "rotation:x", deg_to_rad(-1.0), 1.0).set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)

	# Stop rocking when arrived
	tween.finished.connect(func():
		rock_tween.kill()
		bob_tween.kill()
		pitch_tween.kill()
		ship.rotation = Vector3.ZERO
	)
	print("Ship sailing to: ", stop_pos)
