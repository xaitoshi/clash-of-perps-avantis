extends Node3D
## Camera rig for Clash of Clans / Boom Beach style isometric view.
## The rig is a Node3D that moves in the XZ plane.
## Angled at ~45° looking down at the island.
## Pan with left mouse button drag, zoom with scroll wheel.
## Movement and zoom are clamped to prevent going out of bounds.

# ── Camera Settings ──────────────────────────────────────────────
## How fast the camera pans when dragging (scaled by zoom level)
@export var pan_speed: float = 0.010
## How fast the camera moves with WASD keys
@export var key_pan_speed: float = 3.0
## How fast the camera zooms with scroll wheel
@export var zoom_speed: float = 1.0
## Minimum distance from pivot (closest zoom)
@export var min_zoom: float = 0.5
## Maximum distance from pivot (farthest zoom)
@export var max_zoom: float = 5
## Pinch zoom speed multiplier (touch)
@export var pinch_zoom_speed: float = 0.015
## Smooth interpolation factor (higher = snappier)
@export var smoothing: float = 6.0

## Boundary limits for panning (world units from center)
@export var pan_limit_min: Vector3 = Vector3(-15.0, 0.0, -15.0)
@export var pan_limit_max: Vector3 = Vector3(15.0, 0.0, 15.0)

## Camera pitch angle in degrees (45 = standard Clash-style)
@export_range(20.0, 80.0) var camera_pitch: float = 45.0

# ── Internal State ───────────────────────────────────────────────
var _pitch_pivot: Node3D     # Rotates around X (pitch / tilt)
var _camera: Camera3D

var _current_zoom: float = 15.0
var _target_zoom: float = 15.0
var _target_position: Vector3 = Vector3.ZERO

var _is_panning: bool = false
var zoom_blocked: bool = false

# ── Touch state ──────────────────────────────────────────────────
var _touch_points: Dictionary = {}  # touch_index -> Vector2 position
var _last_pinch_distance: float = 0.0

var _shake_trauma: float = 0.0
const SHAKE_MAX_OFFSET: float = 0.035
const SHAKE_DECAY: float = 2.8

## Add trauma (0–1) to trigger screen shake. Values accumulate, capped at 1.
func add_trauma(amount: float) -> void:
	_shake_trauma = minf(_shake_trauma + amount, 1.0)


func _ready() -> void:
	_pitch_pivot = $PitchPivot
	_camera = $PitchPivot/Camera3D

	_target_position = global_position

	# Apply initial pitch angle
	_pitch_pivot.rotation_degrees.x = -camera_pitch

	# Set initial zoom
	_target_zoom = _camera.position.z
	if _target_zoom < min_zoom or _target_zoom > max_zoom:
		_target_zoom = (min_zoom + max_zoom) / 2.0
	_current_zoom = _target_zoom
	_camera.position.z = _current_zoom


func _unhandled_input(event: InputEvent) -> void:
	# ── Mouse Button Events ──────────────────────────────────────
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton

		# Left click → start/stop panning
		if mb.button_index == MOUSE_BUTTON_LEFT:
			_is_panning = mb.pressed

		# Scroll wheel → zoom in/out
		if mb.pressed and not zoom_blocked:
			if mb.button_index == MOUSE_BUTTON_WHEEL_UP:
				_target_zoom = maxf(_target_zoom - zoom_speed, min_zoom)
			elif mb.button_index == MOUSE_BUTTON_WHEEL_DOWN:
				_target_zoom = minf(_target_zoom + zoom_speed, max_zoom)

	# ── Mouse Motion → Pan ───────────────────────────────────────
	if event is InputEventMouseMotion and _is_panning:
		var motion := event as InputEventMouseMotion
		var delta := motion.relative

		# Pan along world X and Z axes
		var right := Vector3(1.0, 0.0, 0.0)
		var forward := Vector3(0.0, 0.0, 1.0)

		# Scale pan by zoom level so it feels natural at any distance
		var zoom_factor := _current_zoom * 0.2
		_target_position -= right * delta.x * pan_speed * zoom_factor
		_target_position -= forward * delta.y * pan_speed * zoom_factor

		_target_position.y = 0.0

	# ── Touch events (mobile) ────────────────────────────────────
	if event is InputEventScreenTouch:
		var st := event as InputEventScreenTouch
		if st.pressed:
			_touch_points[st.index] = st.position
		else:
			_touch_points.erase(st.index)
			if _touch_points.size() < 2:
				_last_pinch_distance = 0.0

	if event is InputEventScreenDrag:
		var sd := event as InputEventScreenDrag
		_touch_points[sd.index] = sd.position

		if _touch_points.size() == 1:
			# Single finger → pan
			var right := Vector3(1.0, 0.0, 0.0)
			var forward := Vector3(0.0, 0.0, 1.0)
			var zoom_factor := _current_zoom * 0.2
			_target_position -= right * sd.relative.x * pan_speed * zoom_factor
			_target_position -= forward * sd.relative.y * pan_speed * zoom_factor
			_target_position.y = 0.0
		elif _touch_points.size() >= 2 and not zoom_blocked:
			# Two fingers → pinch zoom
			var points := _touch_points.values()
			var p0: Vector2 = points[0]
			var p1: Vector2 = points[1]
			var dist: float = p0.distance_to(p1)
			if _last_pinch_distance > 0.0:
				var diff: float = _last_pinch_distance - dist
				_target_zoom = clampf(_target_zoom + diff * pinch_zoom_speed, min_zoom, max_zoom)
			_last_pinch_distance = dist


func _process(delta_raw: float) -> void:
	var delta = minf(delta_raw, 0.1)
	# ── WASD movement ────────────────────────────────────────────
	var move_dir := Vector3.ZERO
	if Input.is_key_pressed(KEY_W):
		move_dir.z -= 1.0
	if Input.is_key_pressed(KEY_S):
		move_dir.z += 1.0
	if Input.is_key_pressed(KEY_A):
		move_dir.x -= 1.0
	if Input.is_key_pressed(KEY_D):
		move_dir.x += 1.0
	if move_dir != Vector3.ZERO:
		var speed = key_pan_speed * _current_zoom * 0.2 * delta
		_target_position += move_dir.normalized() * speed
		_target_position.y = 0.0

	# ── Q/E zoom ─────────────────────────────────────────────────
	if Input.is_key_pressed(KEY_E):
		_target_zoom = maxf(_target_zoom - zoom_speed * delta * 3.0, min_zoom)
	if Input.is_key_pressed(KEY_Q):
		_target_zoom = minf(_target_zoom + zoom_speed * delta * 3.0, max_zoom)

	# ── C = center camera on island ──────────────────────────────
	if Input.is_key_pressed(KEY_C):
		_target_position = Vector3.ZERO
		_target_zoom = max_zoom

	var t = 1.0 - exp(-smoothing * delta)

	# Smoothly interpolate position (pan)
	global_position = global_position.lerp(_target_position, t)

	# Smoothly interpolate zoom
	_current_zoom = lerpf(_current_zoom, _target_zoom, t)
	_camera.position.z = _current_zoom

	# Apply pitch angle
	_pitch_pivot.rotation_degrees.x = -camera_pitch

	# Screen shake — offset camera in camera-local XY, decays each frame
	if _shake_trauma > 0.0:
		_shake_trauma = maxf(_shake_trauma - SHAKE_DECAY * delta, 0.0)
		var intensity = _shake_trauma * _shake_trauma
		_camera.position.x = randf_range(-1.0, 1.0) * SHAKE_MAX_OFFSET * intensity
		_camera.position.y = randf_range(-1.0, 1.0) * SHAKE_MAX_OFFSET * intensity
	else:
		_camera.position.x = 0.0
		_camera.position.y = 0.0
