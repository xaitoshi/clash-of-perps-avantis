extends Node3D

# Рівень ратуші (від 1 до 3)
var current_level: int = 1

# Базовий масштаб і приріст за рівень (10% на рівень)
const BASE_SCALE: float = 1.0
const SCALE_PER_LEVEL: float = 0.1

@onready var model_l1: Node3D = $Model_L1
@onready var model_l2: Node3D = $Model_L2
@onready var model_l3: Node3D = $Model_L3


func _ready() -> void:
	_show_level(current_level)


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_accept"):
		upgrade()


## Показує модель потрібного рівня і застосовує масштаб
func _show_level(level: int) -> void:
	model_l1.visible = (level == 1)
	model_l2.visible = (level == 2)
	model_l3.visible = (level == 3)

	# Збільшення масштабу: рівень 1 = 1.0, рівень 2 = 1.1, рівень 3 = 1.2
	var s: float = BASE_SCALE + SCALE_PER_LEVEL * (level - 1)
	scale = Vector3(s, s, s)

	print("TownHall: рівень %d | масштаб %.2f" % [level, s])


## Підвищує рівень Ратуші
func upgrade() -> void:
	if current_level >= 3:
		print("TownHall: вже максимальний рівень!")
		return

	current_level += 1
	_show_level(current_level)
