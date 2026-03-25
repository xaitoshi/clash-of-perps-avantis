shader_type spatial;
render_mode unshaded, cull_front, blend_mix;

uniform vec4 outline_color : source_color = vec4(0.4, 0.8, 1.0, 1.0);
uniform float outline_width : hint_range(0.0, 0.2) = 0.02;
uniform float flickering_speed = 10.0;
uniform float minimal_flickering_alpha = 0.2;

void vertex() {
	VERTEX = VERTEX * (1.0 + outline_width);
}

void fragment() {
	float alpha = (sin(TIME * flickering_speed) + 1.2) * 0.5;
	alpha = (1.0 - minimal_flickering_alpha) * alpha + minimal_flickering_alpha;
	
	ALBEDO = outline_color.rgb;
	ALPHA = outline_color.a * alpha;
}
