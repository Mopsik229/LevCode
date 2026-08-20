// We assume `ogl` is loaded globally via UMD from CDN (window.ogl)
const { Renderer, Program, Triangle, Mesh } = window.ogl;

const hexToRgb = hex => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
};

const originToFlip = origin => {
  switch (origin) {
    case 'top-left': return [1, 0];
    case 'bottom-right': return [0, 1];
    case 'bottom-left': return [1, 1];
    default: return [0, 0];
  }
};

class SideRays {
  constructor(container, options = {}) {
    this.container = container;

    // Default options
    this.speed = options.speed ?? 2.5;
    this.rayColor1 = options.rayColor1 ?? '#4e9eff'; // Brand accent color
    this.rayColor2 = options.rayColor2 ?? '#1a5ab3'; // Darker/richer blue for contrast
    this.intensity = options.intensity ?? 3.5; // boosted intensity to make it more visible
    this.spread = options.spread ?? 2;
    this.origin = options.origin ?? 'top-right';
    this.tilt = options.tilt ?? 0;
    this.saturation = options.saturation ?? 1.5;
    this.blend = options.blend ?? 0.75;
    this.falloff = options.falloff ?? 1.4; // reduced falloff to make rays reach further
    this.opacity = options.opacity ?? 1.0;

    this.renderer = null;
    this.mesh = null;
    this.uniforms = null;
    this.animationId = null;
    this.isVisible = false;

    this.init();
  }

  init() {
    this.observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry.isIntersecting && !this.isVisible) {
          this.isVisible = true;
          this.startWebGL();
        } else if (!entry.isIntersecting && this.isVisible) {
          this.isVisible = false;
          this.stopWebGL();
        }
      },
      { threshold: 0.05 } // lowered threshold just in case
    );
    this.observer.observe(this.container);
  }

  async startWebGL() {
    if (this.renderer) return;

    await new Promise(resolve => setTimeout(resolve, 10));

    this.renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      alpha: true
    });

    const gl = this.renderer.gl;
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.position = 'absolute';
    gl.canvas.style.top = '0';
    gl.canvas.style.left = '0';
    gl.canvas.style.pointerEvents = 'none';
    gl.canvas.style.zIndex = '0';

    this.container.appendChild(gl.canvas);

    const vert = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

    const frag = `precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform float iSpeed;
uniform vec3 iRayColor1;
uniform vec3 iRayColor2;
uniform float iIntensity;
uniform float iSpread;
uniform float iFlipX;
uniform float iFlipY;
uniform float iTilt;
uniform float iSaturation;
uniform float iBlend;
uniform float iFalloff;
uniform float iOpacity;

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  float cosAngle = dot(normalize(sourceToCoord), rayRefDirection);
  return clamp(
    (0.45 + 0.15 * sin(cosAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-cosAngle * seedB + iTime * speed)),
    0.0, 1.0) *
    clamp((iResolution.x - length(sourceToCoord)) / iResolution.x, 0.5, 1.0);
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  if (iFlipX > 0.5) fragCoord.x = iResolution.x - fragCoord.x;
  if (iFlipY > 0.5) fragCoord.y = iResolution.y - fragCoord.y;

  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  vec2 rayPos = vec2(iResolution.x * 1.1, -0.5 * iResolution.y);

  float tiltRad = iTilt * 3.14159265 / 180.0;
  float cs = cos(tiltRad);
  float sn = sin(tiltRad);
  vec2 rel = coord - rayPos;
  vec2 tiltedCoord = vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs) + rayPos;

  float halfSpread = iSpread * 0.275;
  vec2 rayRefDir1 = normalize(vec2(cos(0.785398 + halfSpread), sin(0.785398 + halfSpread)));
  vec2 rayRefDir2 = normalize(vec2(cos(0.785398 - halfSpread), sin(0.785398 - halfSpread)));

  vec4 rays1 = vec4(iRayColor1, 1.0) * rayStrength(rayPos, rayRefDir1, tiltedCoord, 36.2214, 21.11349, iSpeed);
  vec4 rays2 = vec4(iRayColor2, 1.0) * rayStrength(rayPos, rayRefDir2, tiltedCoord, 22.3991, 18.0234, iSpeed * 0.2);

  vec4 color = rays1 * (1.0 - iBlend) * 0.9 + rays2 * iBlend * 0.9;

  float distanceToLight = length(fragCoord.xy - vec2(rayPos.x, iResolution.y - rayPos.y)) / iResolution.y;
  float brightness = iIntensity * 0.4 / pow(max(distanceToLight, 0.001), iFalloff);
  color.rgb *= brightness;

  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color.rgb = mix(vec3(gray), color.rgb, iSaturation);

  color.a = max(color.r, max(color.g, color.b)) * iOpacity;
  gl_FragColor = color;
}`;

    const [flipX, flipY] = originToFlip(this.origin);
    this.uniforms = {
      iTime: { value: 0 },
      iResolution: { value: [1, 1] },
      iSpeed: { value: this.speed },
      iRayColor1: { value: hexToRgb(this.rayColor1) },
      iRayColor2: { value: hexToRgb(this.rayColor2) },
      iIntensity: { value: this.intensity },
      iSpread: { value: this.spread },
      iFlipX: { value: flipX },
      iFlipY: { value: flipY },
      iTilt: { value: this.tilt },
      iSaturation: { value: this.saturation },
      iBlend: { value: this.blend },
      iFalloff: { value: this.falloff },
      iOpacity: { value: this.opacity }
    };

    const geometry = new Triangle(gl);
    const program = new Program(gl, { vertex: vert, fragment: frag, uniforms: this.uniforms });
    this.mesh = new Mesh(gl, { geometry, program });

    this.updateSize = () => {
      if (!this.renderer) return;
      this.renderer.dpr = Math.min(window.devicePixelRatio, 2);
      const { clientWidth: w, clientHeight: h } = this.container;
      this.renderer.setSize(w, h);
      this.uniforms.iResolution.value = [w * this.renderer.dpr, h * this.renderer.dpr];
    };

    window.addEventListener('resize', this.updateSize);
    this.updateSize();

    const loop = t => {
      if (!this.renderer || !this.uniforms || !this.mesh) return;
      this.uniforms.iTime.value = t * 0.001;
      try {
        this.renderer.render({ scene: this.mesh });
        this.animationId = requestAnimationFrame(loop);
      } catch (e) {
        return;
      }
    };

    this.animationId = requestAnimationFrame(loop);
  }

  stopWebGL() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.updateSize) {
      window.removeEventListener('resize', this.updateSize);
    }
    if (this.renderer) {
      try {
        const loseCtx = this.renderer.gl.getExtension('WEBGL_lose_context');
        if (loseCtx) loseCtx.loseContext();
        const canvas = this.renderer.gl.canvas;
        if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      } catch (e) { }
    }
    this.renderer = null;
    this.uniforms = null;
    this.mesh = null;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.siderays-bg');
  if (container) {
    // Adding a slight delay to ensure everything is loaded, including UMD
    setTimeout(() => {
      if (window.ogl) {
        new SideRays(container);
      } else {
        console.error("OGL library not found.");
      }
    }, 100);
  }
});
