extends Node2D

# ============================================================
#  WORLD MAP v3 — animated water, organic islands, clouds,
#                  sunken ships, drag-to-pan + zoom
# ============================================================

const MAP_W : float = 3200.0
const MAP_H : float = 2400.0

const OTHER_ISLANDS: Array = [
	{"name": "Resource Base", "type": "resource",  "size": 140, "pos": Vector2( 700,  600), "level": 12, "seed": 2.5},
	{"name": "Resource Base", "type": "resource",  "size": 128, "pos": Vector2(2300,  700), "level":  8, "seed": 5.1},
	{"name": "Resource Base", "type": "resource",  "size": 120, "pos": Vector2( 800, 1700), "level": 15, "seed": 8.3},
	{"name": "Resource Base", "type": "resource",  "size": 135, "pos": Vector2(2500, 1600), "level":  9, "seed": 3.7},
	{"name": "Alex's Base",   "type": "enemy",    "size": 150, "pos": Vector2( 350, 1150), "level": 22, "seed": 6.2},
	{"name": "Maria's Base",  "type": "enemy",    "size": 142, "pos": Vector2(2850, 1100), "level": 30, "seed": 9.4},
	{"name": "Tom's Base",    "type": "enemy",    "size": 135, "pos": Vector2(1550,  380), "level": 18, "seed": 4.8},
	{"name": "Sara's Base",   "type": "enemy",    "size": 130, "pos": Vector2(1650, 2020), "level": 25, "seed": 7.1},
	{"name": "",              "type": "deco",     "size":  72, "pos": Vector2(1050,  320), "level":  0, "seed": 1.5},
	{"name": "",              "type": "deco",     "size":  62, "pos": Vector2(2160,  340), "level":  0, "seed": 2.8},
	{"name": "",              "type": "deco",     "size":  76, "pos": Vector2( 430,  490), "level":  0, "seed": 5.5},
	{"name": "",              "type": "deco",     "size":  58, "pos": Vector2(2760,  440), "level":  0, "seed": 3.3},
	{"name": "",              "type": "deco",     "size":  66, "pos": Vector2( 550, 2110), "level":  0, "seed": 8.8},
	{"name": "",              "type": "deco",     "size":  60, "pos": Vector2(2710, 2060), "level":  0, "seed": 6.6},
]

const PLAYER_POS : Vector2 = Vector2(1600, 1200)

const SHIPS: Array = [
	{"pos": Vector2(1100,  900), "rot": 0.4,  "size": 1.0},
	{"pos": Vector2(2100, 1500), "rot": 1.1,  "size": 0.8},
	{"pos": Vector2( 600, 1400), "rot": 2.5,  "size": 0.9},
	{"pos": Vector2(2600,  900), "rot": 0.8,  "size": 0.85},
	{"pos": Vector2(1300, 1900), "rot": 3.0,  "size": 0.75},
]

const CLOUD_DATA: Array = [
	{"pos": Vector2( 400,  200), "w": 220, "h": 80,  "speed": Vector2(12,  3)},
	{"pos": Vector2(1100,  150), "w": 180, "h": 65,  "speed": Vector2( 9, -2)},
	{"pos": Vector2(1800,  250), "w": 260, "h": 90,  "speed": Vector2(15,  4)},
	{"pos": Vector2(2500,  180), "w": 200, "h": 72,  "speed": Vector2(11,  2)},
	{"pos": Vector2( 300,  800), "w": 170, "h": 60,  "speed": Vector2( 8, -3)},
	{"pos": Vector2(2700,  700), "w": 190, "h": 68,  "speed": Vector2(13,  1)},
	{"pos": Vector2( 900, 2100), "w": 240, "h": 82,  "speed": Vector2(10,  3)},
	{"pos": Vector2(2200, 2200), "w": 210, "h": 74,  "speed": Vector2( 7, -2)},
	{"pos": Vector2(1500,  500), "w": 155, "h": 55,  "speed": Vector2(16,  5)},
	{"pos": Vector2( 700, 1900), "w": 175, "h": 62,  "speed": Vector2( 6,  2)},
]

var _camera       : Camera2D
var _dragging     : bool = false
var _drag_start   : Vector2
var _cam_start    : Vector2
var _water_mat    : ShaderMaterial
var _blob_shader  : Shader
var _time         : float = 0.0
var _clouds       : Array = []
var _fade_overlay : ColorRect
var _half_w       : float
var _half_h       : float


func _ready() -> void:
	var vp := get_viewport_rect().size
	_half_w = vp.x * 0.5
	_half_h = vp.y * 0.5
	_setup_camera()
	_build_water()
	_blob_shader = _island_blob_shader()   # must exist before player island
	_build_player_island()
	_build_other_islands()
	_build_ships()
	_build_clouds()
	_build_ui()
	_fade_in()


func _process(delta: float) -> void:
	_time += delta
	if _water_mat:
		_water_mat.set_shader_parameter("time_val", _time)
	for c in _clouds:
		var n: Node2D = c["node"]
		var bp: Vector2 = c["base"]
		var sp: Vector2 = c["speed"]
		var ox := fmod(_time * sp.x, MAP_W + 400.0)
		var oy := sin(_time * 0.2 + float(c["phase"])) * 30.0
		n.position = Vector2(bp.x + ox, bp.y + oy)
		if n.position.x > MAP_W + 200.0:
			n.position.x -= MAP_W + 400.0


func _input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT:
			_dragging = mb.pressed
			if _dragging:
				_drag_start = mb.position
				_cam_start  = _camera.global_position
		elif mb.button_index == MOUSE_BUTTON_WHEEL_UP:
			_camera.zoom = (_camera.zoom + Vector2(0.08, 0.08)).clamp(Vector2(0.5,0.5), Vector2(2.5,2.5))
		elif mb.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			_camera.zoom = (_camera.zoom - Vector2(0.08, 0.08)).clamp(Vector2(0.5,0.5), Vector2(2.5,2.5))
	elif event is InputEventMouseMotion and _dragging:
		var mm := event as InputEventMouseMotion
		var d: Vector2 = mm.position - _drag_start
		var np: Vector2 = _cam_start - d
		_camera.global_position = Vector2(
			clamp(np.x, _half_w, MAP_W - _half_w),
			clamp(np.y, _half_h, MAP_H - _half_h)
		)


# ============================================================
#  CAMERA
# ============================================================
func _setup_camera() -> void:
	_camera = Camera2D.new()
	_camera.global_position = PLAYER_POS
	_camera.limit_left   = 0
	_camera.limit_right  = int(MAP_W)
	_camera.limit_top    = 0
	_camera.limit_bottom = int(MAP_H)
	add_child(_camera)


# ============================================================
#  ANIMATED WATER
# ============================================================
func _build_water() -> void:
	var w := ColorRect.new()
	w.position = Vector2.ZERO
	w.size     = Vector2(MAP_W, MAP_H)
	_water_mat = ShaderMaterial.new()
	_water_mat.shader = _water_shader()
	w.material = _water_mat
	add_child(w)


func _water_shader() -> Shader:
	var sh := Shader.new()
	sh.code = """
shader_type canvas_item;
uniform float time_val = 0.0;
void fragment() {
	vec2 uv = UV;
	float w1 = sin(uv.x * 12.0 + time_val * 1.1 + uv.y * 3.0) * 0.5 + 0.5;
	float w2 = cos(uv.y * 10.0 + time_val * 0.8 - uv.x * 2.5) * 0.5 + 0.5;
	float w3 = sin((uv.x + uv.y) * 8.0 + time_val * 0.6)       * 0.5 + 0.5;
	float wave = w1 * 0.40 + w2 * 0.35 + w3 * 0.25;
	float foam = pow(w1 * w2, 5.0) * 0.55;
	vec3 deep    = vec3(0.06, 0.24, 0.52);
	vec3 mid     = vec3(0.12, 0.42, 0.72);
	vec3 col = mix(deep, mid, wave * 0.7);
	col = mix(col, vec3(0.22, 0.62, 0.88), w3 * 0.28);
	col = mix(col, vec3(0.85, 0.95, 1.0), foam);
	col = mix(col, col * 0.75, uv.y * 0.35);
	COLOR = vec4(col, 1.0);
}
"""
	return sh


# ============================================================
#  PLAYER ISLAND — two organic blob nodes (main + sub-island)
# ============================================================
func _build_player_island() -> void:
	var centre := PLAYER_POS

	# Main large island
	_spawn_blob(centre, 280.0, 12.5, Color(0.32, 0.70, 0.26))

	# Smaller sub-island lower-right, like the real island's SmallGrass
	_spawn_blob(centre + Vector2(230, 185), 115.0, 7.3, Color(0.30, 0.67, 0.24))

	# Level badge
	var badge := _make_badge(33, "resource")
	badge.position = centre - Vector2(15, 305)
	add_child(badge)

	# "You" label
	var nlbl := Label.new()
	nlbl.text = "⭐  You"
	nlbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	nlbl.custom_minimum_size  = Vector2(160, 0)
	nlbl.position = centre + Vector2(-80, 300)
	nlbl.add_theme_font_size_override("font_size", 18)
	nlbl.add_theme_color_override("font_color", Color(1, 1, 0.45))
	nlbl.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.95))
	nlbl.add_theme_constant_override("shadow_offset_x", 2)
	nlbl.add_theme_constant_override("shadow_offset_y", 2)
	add_child(nlbl)

	# Pulse ring — sized proportionally to the main island
	_add_pulse_ring(centre, 110.0)


# Shared helper used by both player and other islands
func _spawn_blob(pos: Vector2, size: float, sd: float, gc: Color) -> void:
	var blob := ColorRect.new()
	blob.size     = Vector2(size * 2.2, size * 2.2)
	blob.position = pos - blob.size * 0.5
	var mat := ShaderMaterial.new()
	mat.shader = _blob_shader
	mat.set_shader_parameter("seed",      sd)
	mat.set_shader_parameter("grass_col", gc)
	blob.material = mat
	add_child(blob)


# ============================================================
#  OTHER ISLANDS
# ============================================================
func _build_other_islands() -> void:
	for data in OTHER_ISLANDS:
		_spawn_blob_island(data)


func _spawn_blob_island(data: Dictionary) -> void:
	var pos : Vector2 = data["pos"]
	var size: float   = data["size"]
	var typ : String  = data["type"]
	var nm  : String  = data["name"]
	var lvl : int     = data["level"]
	var sd  : float   = data["seed"]

	var gc := Color(0.28, 0.62, 0.22) if typ != "enemy" else Color(0.30, 0.58, 0.24)
	_spawn_blob(pos, size, sd, gc)

	if lvl > 0 and typ != "deco":
		var badge := _make_badge(lvl, typ)
		badge.position = pos - Vector2(15, size * 1.05)
		add_child(badge)

	if nm != "":
		var nlbl := Label.new()
		nlbl.text = nm
		nlbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		nlbl.custom_minimum_size  = Vector2(150, 0)
		nlbl.position = pos + Vector2(-75, size * 1.10)
		nlbl.add_theme_font_size_override("font_size", 13)
		var col := Color(0.94, 0.88, 0.50) if typ == "resource" else Color(1.0, 0.62, 0.62)
		nlbl.add_theme_color_override("font_color", col)
		nlbl.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.9))
		nlbl.add_theme_constant_override("shadow_offset_x", 1)
		nlbl.add_theme_constant_override("shadow_offset_y", 1)
		add_child(nlbl)


func _island_blob_shader() -> Shader:
	var sh := Shader.new()
	sh.code = """
shader_type canvas_item;
uniform float seed      : hint_range(0.0, 20.0) = 1.0;
uniform vec3  grass_col : source_color = vec3(0.25, 0.62, 0.22);
void fragment() {
	vec2 uv = UV - vec2(0.5);
	float a = atan(uv.y, uv.x);
	float s = seed;
	float r = 0.36
		+ 0.065 * sin(a * 2.0 + s * 1.30)
		+ 0.055 * cos(a * 3.0 + s * 2.70)
		+ 0.040 * sin(a * 4.0 + s * 1.85)
		+ 0.030 * cos(a * 5.0 + s * 3.20)
		+ 0.020 * sin(a * 7.0 + s * 2.10);
	float d = length(uv);
	float island = smoothstep(r + 0.025, r - 0.005, d);
	float grass  = smoothstep(r - 0.045, r - 0.085, d);
	vec3 sand  = mix(vec3(0.92,0.84,0.60), vec3(0.78,0.68,0.45), d / r);
	vec3 green = mix(grass_col * 0.72, grass_col * 1.15, 1.0 - d / max(r,0.001));
	vec3 col = mix(sand, green, grass);
	float sf = fract(s * 0.318); float sg = fract(s * 0.159);
	vec2 t1 = uv - vec2(sf * 0.18 - 0.09, sg * 0.16 - 0.08);
	vec2 t2 = uv - vec2(-sg * 0.14 + 0.05, fract(s*0.477) * 0.14 - 0.06);
	float trees = clamp(smoothstep(0.10,0.065,length(t1)) + smoothstep(0.09,0.060,length(t2)), 0.0, 1.0);
	col = mix(col, grass_col * 0.58, trees * grass);
	COLOR = vec4(col, island);
}
"""
	return sh


# ============================================================
#  SUNKEN SHIPS
# ============================================================
func _build_ships() -> void:
	for s in SHIPS:
		_spawn_ship(s["pos"], s["rot"], s["size"])


func _spawn_ship(pos: Vector2, rot: float, sz: float) -> void:
	var hull := ColorRect.new()
	hull.size = Vector2(90.0 * sz, 30.0 * sz)
	hull.position = pos - hull.size * 0.5
	hull.rotation = rot
	var hmat := ShaderMaterial.new()
	hmat.shader = _ship_hull_shader()
	hull.material = hmat
	add_child(hull)

	var mast := ColorRect.new()
	mast.size = Vector2(4.0 * sz, 55.0 * sz)
	mast.position = pos - mast.size * 0.5 + Vector2(cos(rot) * 5.0, sin(rot) * 5.0)
	mast.rotation = rot + PI * 0.5
	var mmat := ShaderMaterial.new()
	mmat.shader = _ship_mast_shader()
	mast.material = mmat
	add_child(mast)

	var lbl := Label.new()
	lbl.text = "⚓"
	lbl.add_theme_font_size_override("font_size", 14)
	lbl.add_theme_color_override("font_color", Color(0.70, 0.70, 0.85, 0.70))
	lbl.position = pos + Vector2(45.0 * sz, -10.0)
	add_child(lbl)


func _ship_hull_shader() -> Shader:
	var sh := Shader.new()
	sh.code = """
shader_type canvas_item;
void fragment() {
	vec2 uv = UV - vec2(0.5);
	float hull = smoothstep(0.52, 0.48, length(uv * vec2(1.0, 2.8)));
	vec3 col = mix(vec3(0.22, 0.18, 0.14), vec3(0.35, 0.28, 0.20), UV.y);
	COLOR = vec4(col, hull * 0.72);
}
"""
	return sh


func _ship_mast_shader() -> Shader:
	var sh := Shader.new()
	sh.code = """
shader_type canvas_item;
void fragment() {
	float alpha = smoothstep(0.6, 0.4, abs(UV.x - 0.5) * 3.0);
	COLOR = vec4(0.30, 0.24, 0.18, alpha * 0.65);
}
"""
	return sh


# ============================================================
#  CLOUDS
# ============================================================
func _build_clouds() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = 12345
	for cd in CLOUD_DATA:
		var cloud := _make_cloud(cd["w"], cd["h"])
		cloud.position = cd["pos"]
		add_child(cloud)
		_clouds.append({
			"node":  cloud,
			"base":  cd["pos"],
			"speed": cd["speed"],
			"phase": rng.randf_range(0.0, TAU),
		})


func _make_cloud(w: float, h: float) -> Node2D:
	var root := Node2D.new()
	var offsets: Array = [
		Vector2(0, 0),
		Vector2(w * 0.28,  -h * 0.18),
		Vector2(-w * 0.24, -h * 0.12),
		Vector2(w * 0.12,   h * 0.15),
	]
	var sizes: Array = [
		Vector2(w,       h),
		Vector2(w * 0.7, h * 0.75),
		Vector2(w * 0.6, h * 0.70),
		Vector2(w * 0.5, h * 0.60),
	]
	for i in offsets.size():
		var blob := ColorRect.new()
		blob.size = sizes[i]
		blob.position = offsets[i] - sizes[i] * 0.5
		var mat := ShaderMaterial.new()
		mat.shader = _cloud_blob_shader()
		blob.material = mat
		root.add_child(blob)
	return root


func _cloud_blob_shader() -> Shader:
	var sh := Shader.new()
	sh.code = """
shader_type canvas_item;
void fragment() {
	vec2 uv = UV - vec2(0.5);
	float d = length(uv * vec2(1.0, 1.6)) * 2.0;
	float a = smoothstep(1.0, 0.65, d) * 0.72;
	vec3 col = mix(vec3(0.95, 0.97, 1.0), vec3(0.82, 0.88, 0.96), UV.y * 0.6);
	COLOR = vec4(col, a);
}
"""
	return sh


# ============================================================
#  HELPERS
# ============================================================
func _make_badge(lvl: int, typ: String) -> Label:
	var lbl := Label.new()
	lbl.text = str(lvl)
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.vertical_alignment   = VERTICAL_ALIGNMENT_CENTER
	lbl.custom_minimum_size  = Vector2(30, 30)
	lbl.add_theme_font_size_override("font_size", 11)
	lbl.add_theme_color_override("font_color", Color.WHITE)
	var s := StyleBoxFlat.new()
	s.bg_color = Color(0.12, 0.55, 0.85) if typ != "enemy" else Color(0.72, 0.18, 0.18)
	s.set_corner_radius_all(15)
	s.set_border_width_all(2)
	s.border_color = Color(1, 1, 1, 0.75)
	lbl.add_theme_stylebox_override("normal", s)
	return lbl


func _add_pulse_ring(pos: Vector2, radius: float) -> void:
	var ring := ColorRect.new()
	ring.size     = Vector2(radius * 2.0, radius * 2.0)
	ring.position = pos - ring.size * 0.5
	var mat := ShaderMaterial.new()
	mat.shader = _ring_shader()
	ring.material = mat
	add_child(ring)
	var tw := create_tween().set_loops()
	tw.tween_property(ring, "modulate:a", 1.0, 1.0)
	tw.tween_property(ring, "modulate:a", 0.1, 1.0)


func _ring_shader() -> Shader:
	var sh := Shader.new()
	sh.code = """
shader_type canvas_item;
void fragment() {
	vec2 c = UV - vec2(0.5);
	float d = length(c) * 2.0;
	float ring = smoothstep(0.86,0.90,d) * (1.0 - smoothstep(0.96,1.0,d));
	COLOR = vec4(1.0, 1.0, 0.25, ring * COLOR.a);
}
"""
	return sh


# ============================================================
#  UI
# ============================================================
func _build_ui() -> void:
	var ui := CanvasLayer.new()
	add_child(ui)

	var hint := Label.new()
	hint.text = "🖱 Drag to explore   •   Scroll to zoom"
	hint.set_anchors_preset(Control.PRESET_CENTER_TOP)
	hint.offset_top   = 10
	hint.offset_left  = -200
	hint.offset_right = 200
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint.add_theme_font_size_override("font_size", 14)
	hint.add_theme_color_override("font_color", Color(0.85, 0.92, 1.0, 0.75))
	hint.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.8))
	hint.add_theme_constant_override("shadow_offset_x", 1)
	hint.add_theme_constant_override("shadow_offset_y", 1)
	ui.add_child(hint)

	var home := _game_btn("🏠  Home", Color(0.95, 0.70, 0.15), Color(0.10, 0.06, 0.02))
	home.custom_minimum_size = Vector2(162, 58)
	home.anchor_left = 1.0;  home.anchor_right  = 1.0
	home.anchor_top  = 1.0;  home.anchor_bottom = 1.0
	home.offset_left = -180; home.offset_right  = -14
	home.offset_top  = -78;  home.offset_bottom = -14
	home.pressed.connect(_go_home)
	ui.add_child(home)

	_fade_overlay = ColorRect.new()
	_fade_overlay.color = Color(0, 0, 0, 1)
	_fade_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	_fade_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui.add_child(_fade_overlay)


func _game_btn(txt: String, bg: Color, fg: Color) -> Button:
	var btn := Button.new()
	btn.text = txt
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.set_corner_radius_all(14)
	s.set_content_margin_all(14)
	btn.add_theme_stylebox_override("normal", s)
	var hov := s.duplicate() as StyleBoxFlat
	hov.bg_color = bg.lightened(0.18)
	btn.add_theme_stylebox_override("hover", hov)
	var pr2 := s.duplicate() as StyleBoxFlat
	pr2.bg_color = bg.darkened(0.18)
	btn.add_theme_stylebox_override("pressed", pr2)
	btn.add_theme_color_override("font_color", fg)
	btn.add_theme_font_size_override("font_size", 18)
	return btn


# ============================================================
#  TRANSITIONS
# ============================================================
func _fade_in() -> void:
	if _fade_overlay:
		var tw := create_tween()
		tw.tween_property(_fade_overlay, "color:a", 0.0, 0.55)


func _go_home() -> void:
	if _fade_overlay:
		_fade_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	var tw := create_tween()
	tw.tween_property(_fade_overlay, "color:a", 1.0, 0.45)
	await tw.finished
	get_tree().change_scene_to_file("res://island.tscn")
