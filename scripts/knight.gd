extends Node3D
## Knight character with sword and run animation.

@export var model_scene: PackedScene
@export var sword_scene: PackedScene
@export var model_scale: float = 0.05

var anim_player: AnimationPlayer
var skeleton: Skeleton3D

func _ready() -> void:
	_spawn_knight()


func _spawn_knight() -> void:
	var knight_res = model_scene
	if knight_res == null:
		knight_res = load("res://Model/Characters/Model/Knight.glb")
	if knight_res == null:
		push_warning("Knight: model not found")
		return

	var knight = knight_res.instantiate()
	knight.scale = Vector3(model_scale, model_scale, model_scale)
	add_child(knight)

	_find_nodes(knight)
	_attach_sword()
	_play_run()


func _find_nodes(root: Node) -> void:
	for child in root.get_children():
		if child is AnimationPlayer and anim_player == null:
			anim_player = child
		if child is Skeleton3D and skeleton == null:
			skeleton = child
		_find_nodes(child)


func _attach_sword() -> void:
	if skeleton == null:
		return

	var sword_res = sword_scene
	if sword_res == null:
		sword_res = load("res://Model/Characters/Assets/sword_1handed.gltf")
	if sword_res == null:
		return

	# Find right hand bone
	var hand_idx := -1
	for i in range(skeleton.get_bone_count()):
		var bone_name = skeleton.get_bone_name(i).to_lower()
		if "hand" in bone_name and "r" in bone_name:
			hand_idx = i
			break
	if hand_idx == -1:
		for i in range(skeleton.get_bone_count()):
			var bone_name = skeleton.get_bone_name(i).to_lower()
			if "hand" in bone_name:
				hand_idx = i
				break

	if hand_idx == -1:
		return

	var attachment = BoneAttachment3D.new()
	attachment.bone_idx = hand_idx
	attachment.bone_name = skeleton.get_bone_name(hand_idx)
	skeleton.add_child(attachment)

	var sword = sword_res.instantiate()
	sword.scale = Vector3(1.0 / model_scale, 1.0 / model_scale, 1.0 / model_scale)
	attachment.add_child(sword)


func _play_run() -> void:
	if anim_player == null:
		return

	var anims = anim_player.get_animation_list()
	print("Knight animations: ", anims)

	# Try to find run animation
	for anim_name in anims:
		if "run" in anim_name.to_lower():
			anim_player.play(anim_name)
			return

	# Fallback: first non-RESET animation
	for anim_name in anims:
		if anim_name != "RESET":
			anim_player.play(anim_name)
			return
