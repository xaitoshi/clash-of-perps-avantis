extends BaseTroop
## Knight — melee fighter. Damage when sword touches the building mid-swing.

@export var sword_scene: String = "res://Model/Characters/Assets/sword_1handed.gltf"
@export var hit_distance: float = 0.25
@export var hit_anim_threshold: float = 0.4

var _sword_attachment: BoneAttachment3D
var _hit_this_swing: bool = false


const LEVEL_STATS = {
	1: {"hp": 1100, "damage": 75, "atk_speed": 1.667},
	2: {"hp": 1450, "damage": 100, "atk_speed": 1.538},
	3: {"hp": 1850, "damage": 130, "atk_speed": 1.429},
}

func _init_stats() -> void:
	var s = LEVEL_STATS[level]
	move_speed = 0.5
	attack_range = 0.24
	hp = s.hp
	damage = s.damage
	atk_speed = s.atk_speed
	attack_anim = "Melee_1H_Attack_Chop"
	anim_files = [
		"res://Model/Characters/Animations/Rig_Medium/Rig_Medium_General.glb",
		"res://Model/Characters/Animations/Rig_Medium/Rig_Medium_MovementBasic.glb",
		"res://Model/Characters/Animations/Rig_Medium/Rig_Medium_CombatMelee.glb",
		"res://Model/Characters/Animations/Rig_Medium/Rig_Medium_Simulation.glb",
	]


func _setup_weapons() -> void:
	_sword_attachment = _attach_to_bone("handslot.r", "SwordAttachment", sword_scene, "Sword")


func _do_attack(delta: float) -> void:
	if not _has_valid_target():
		_hit_this_swing = false
		_find_next_target()
		return

	attack_timer += delta
	if attack_timer >= atk_speed:
		attack_timer -= atk_speed
		_hit_this_swing = false
		if anim_player.has_animation(attack_anim):
			anim_player.stop()
			anim_player.play(attack_anim)

	# Hit only after animation passes threshold AND weapon is close
	if not _hit_this_swing and _sword_attachment and _has_valid_target():
		if anim_player.is_playing() and anim_player.current_animation == attack_anim:
			var anim_len = anim_player.current_animation_length
			if anim_len > 0 and anim_player.current_animation_position / anim_len >= hit_anim_threshold:
				var sword_pos = _sword_attachment.global_position
				var t_pos = _get_target_position()
				if sword_pos.distance_to(t_pos) <= hit_distance:
					_hit_this_swing = true
					_deal_target_damage()
