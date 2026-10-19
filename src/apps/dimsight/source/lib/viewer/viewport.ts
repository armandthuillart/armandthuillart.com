import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import type { Vector3 } from '../../native/contract.ts';
import { UI_CAMERA_DIRECTIONS } from './constants';
import type { UICameraAngle, ViewportOptions, ViewTransition } from './types';

interface ControlsEvents {
  change: object;
  end: object;
  start: object;
}

class ViewerControls extends THREE.EventDispatcher<ControlsEvents> {
  maxZoom = Infinity;
  minZoom = 0.1;
  rotateSpeed = 1;
  readonly target = new THREE.Vector3();

  private button = 0;
  private enabled = true;
  private panModifier = false;
  private readonly pointers = new Map<number, THREE.Vector2>();
  private rotationAxis: 'horizontal' | 'vertical' | null = null;
  private readonly rotationStart = new THREE.Vector2();

  constructor(
    private readonly camera: THREE.OrthographicCamera,
    private readonly canvas: HTMLCanvasElement,
    private readonly inset: number,
  ) {
    super();
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerUp);
    canvas.addEventListener('contextmenu', this.onContextMenu);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  dispose(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.pointers.clear();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    if (!enabled) {
      this.pointers.clear();
    }
  }

  update(): void {
    this.camera.lookAt(this.target);
    this.dispatchEvent({ type: 'change' });
  }

  private onContextMenu = (): void => {
    for (const pointerId of this.pointers.keys()) {
      if (this.canvas.hasPointerCapture(pointerId)) {
        this.canvas.releasePointerCapture(pointerId);
      }
    }
    if (this.pointers.size === 0) return;
    this.pointers.clear();
    this.panModifier = false;
    this.rotationAxis = null;
    this.dispatchEvent({ type: 'end' });
  };

  private onPointerDown = (event: PointerEvent): void => {
    if (!this.enabled) return;

    this.button = event.button;
    this.pointers.set(event.pointerId, new THREE.Vector2(event.clientX, event.clientY));
    this.canvas.setPointerCapture(event.pointerId);
    if (this.pointers.size === 1) {
      this.panModifier = event.button === 0 && event.metaKey && event.pointerType !== 'touch';
      this.rotationAxis = null;
      this.rotationStart.set(event.clientX, event.clientY);
      this.dispatchEvent({ type: 'start' });
    }
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.enabled) return;

    const previous = this.pointers.get(event.pointerId);
    if (!previous) return;

    const current = new THREE.Vector2(event.clientX, event.clientY);
    if (this.pointers.size === 1) {
      const deltaX = current.x - previous.x;
      const deltaY = current.y - previous.y;
      if (this.panModifier) this.pan(deltaX, deltaY);
      else if (event.pointerType === 'touch' || this.button === 0) {
        const movementX = current.x - this.rotationStart.x;
        const movementY = current.y - this.rotationStart.y;
        if (!this.rotationAxis && Math.max(Math.abs(movementX), Math.abs(movementY)) >= 2) {
          this.rotationAxis =
            Math.abs(movementX) >= Math.abs(movementY) ? 'horizontal' : 'vertical';
        }
        if (this.rotationAxis === 'horizontal') this.rotate(deltaX, 0);
        if (this.rotationAxis === 'vertical') this.rotate(0, deltaY);
      } else if (this.button === 1) this.zoom(deltaY * 0.01);
      else this.pan(deltaX, deltaY);
    } else if (this.pointers.size === 2) {
      const other = [...this.pointers.entries()].find(([id]) => id !== event.pointerId)?.[1];
      if (other) {
        const previousDistance = previous.distanceTo(other);
        const currentDistance = current.distanceTo(other);
        this.pan((current.x - previous.x) / 2, (current.y - previous.y) / 2);
        if (previousDistance > 0 && currentDistance > 0) {
          this.zoom(Math.log(previousDistance / currentDistance));
        }
      }
    }
    this.pointers.set(event.pointerId, current);
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (!this.enabled) return;

    this.pointers.delete(event.pointerId);
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
    if (this.pointers.size === 0) {
      this.panModifier = false;
      this.rotationAxis = null;
      this.dispatchEvent({ type: 'end' });
    }
  };

  private onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.dispatchEvent({ type: 'start' });
    this.zoom(event.deltaY * 0.006);
    this.dispatchEvent({ type: 'end' });
  };

  private pan(deltaX: number, deltaY: number): void {
    const height = Math.max(this.canvas.clientHeight - this.inset, 1);
    const worldHeight = (this.camera.top - this.camera.bottom) / this.camera.zoom;
    const scale = worldHeight / height;
    const up = this.camera.up.clone().normalize();
    const right = new THREE.Vector3()
      .subVectors(this.target, this.camera.position)
      .cross(up)
      .normalize();
    const movement = right.multiplyScalar(-deltaX * scale).add(up.multiplyScalar(deltaY * scale));
    this.camera.position.add(movement);
    this.target.add(movement);
    this.update();
  }

  private rotate(deltaX: number, deltaY: number): void {
    const size = Math.max(
      Math.min(this.canvas.clientWidth, this.canvas.clientHeight - this.inset),
      1,
    );
    const offset = this.camera.position.clone().sub(this.target);
    const up = this.camera.up.clone().normalize();
    const yaw = new THREE.Quaternion().setFromAxisAngle(
      up,
      (-deltaX * Math.PI * 2 * this.rotateSpeed) / size,
    );
    offset.applyQuaternion(yaw);

    const right = new THREE.Vector3().crossVectors(offset, up).normalize();
    const pitch = new THREE.Quaternion().setFromAxisAngle(
      right,
      (deltaY * Math.PI * 2 * this.rotateSpeed) / size,
    );
    offset.applyQuaternion(pitch);
    this.camera.up.applyQuaternion(pitch).normalize();
    this.camera.position.copy(this.target).add(offset);
    this.update();
  }

  private zoom(delta: number): void {
    this.camera.zoom = THREE.MathUtils.clamp(
      this.camera.zoom * Math.exp(-delta),
      this.minZoom,
      this.maxZoom,
    );
    this.camera.updateProjectionMatrix();
    this.update();
  }
}

const CAMERA_DISTANCE_FACTOR = 4;

export class Viewport {
  // These values mirror the custom preview lights in native/src/step_renderer.cpp.
  private readonly ambientLight = new THREE.AmbientLight(0xf2f7ff, 0.65);
  private autoRotationEnabled = false;
  private readonly background = new THREE.Color(0xf5f5f5);
  private readonly beforeRender = new Set<() => void>();
  private bottomInset: number;
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 1000);
  private cameraRevision = 0;
  private readonly controls: ViewerControls;
  private disposed = false;
  private readonly environment: THREE.Texture;
  private readonly environmentGenerator: THREE.PMREMGenerator;
  private readonly fillLight = new THREE.DirectionalLight(0xd1e6ff, 0.45);
  private frameDistance = 1;

  private frameHalfHeight = 1;
  private frameRadius = 0;
  private readonly frameRotation = new THREE.Quaternion();
  private height = 0;
  private readonly keyLight = new THREE.DirectionalLight(0xfff5e6, 1.5);
  private lastFrameTime: number | null = null;
  private lightingBounds: THREE.Box3 | null = null;
  private paused = false;
  private pixelRatio = 0;
  private readonly projectedPosition = new THREE.Vector3();
  private readonly raycaster = new THREE.Raycaster();
  private readonly renderer: THREE.WebGLRenderer;
  private renderFrame: number | null = null;
  private renderScheduled = false;
  private readonly scene = new THREE.Scene();
  private transition: ViewTransition | null = null;
  private width = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    options: ViewportOptions = {},
  ) {
    this.bottomInset = options.bottomInset ?? 0;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas,
      powerPreference: 'high-performance',
    });
    this.renderer.localClippingEnabled = true;
    // OCCT's raster PBR path leaves tone mapping disabled and converts the
    // linear result to sRGB at the framebuffer boundary.
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.environmentGenerator = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.environment = this.environmentGenerator.fromScene(room).texture;
    room.dispose();
    this.scene.environment = this.environment;
    // OCCT bakes its skydome into the PBR environment. RoomEnvironment is
    // Three.js's closest built-in procedural equivalent, kept subordinate to
    // the explicit OCCT-style ambient and directional lights.
    this.scene.environmentIntensity = 0.35;

    // OCCT enables shadow rendering globally, but its preview lights do not
    // opt into shadow casting, so the preview has no shadow-map contribution.
    this.keyLight.castShadow = false;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.bias = 0.005;
    this.keyLight.shadow.radius = 1;
    this.keyLight.shadow.intensity = 1;
    this.scene.add(
      this.ambientLight,
      this.keyLight,
      this.keyLight.target,
      this.fillLight,
      this.fillLight.target,
    );

    this.controls = new ViewerControls(this.camera, canvas, this.bottomInset);
    this.controls.rotateSpeed = 2;
    this.controls.addEventListener('change', this.handleControlsChange);

    this.scene.background = this.background;
    this.resize();
  }

  attach(object: THREE.Object3D): void {
    this.scene.add(object);
    this.requestRender();
  }

  captureScreenshot(): Promise<Blob> {
    this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
    this.renderImmediately();

    const screenshot = new Promise<Blob>((resolve, reject) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not create screenshot'));
        }
      }, 'image/webp');
    });

    this.applyBottomInset();
    this.camera.updateProjectionMatrix();
    this.renderImmediately();

    return screenshot;
  }

  detach(object: THREE.Object3D): void {
    object.removeFromParent();
    this.requestRender();
  }

  dispose(): void {
    if (this.disposed) return;

    this.disposed = true;
    this.controls.removeEventListener('change', this.handleControlsChange);
    this.controls.dispose();
    this.beforeRender.clear();

    this.environment.dispose();
    this.environmentGenerator.dispose();
    this.renderer.dispose();
  }

  frameBounds(bounds: THREE.Box3, transition = false): void {
    if (bounds.isEmpty()) return;

    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const radius = Math.max(sphere.radius, Number.EPSILON);
    const distance = radius * CAMERA_DISTANCE_FACTOR;

    const direction = this.camera.position.clone().sub(this.controls.target);
    if (direction.lengthSq() === 0) direction.set(1, 1, 1);
    direction.normalize();

    const target = sphere.center.clone();
    const position = target.clone().addScaledVector(direction, distance);

    this.frameDistance = distance;
    this.frameRadius = radius;
    this.frameHalfHeight = this.halfHeightForRadius(radius);
    this.camera.near = Math.max(radius / 50, 0.001);
    this.camera.far = Math.max(radius * 25, 1000);
    this.camera.zoom = 1;
    this.updateFrustum();
    this.camera.updateProjectionMatrix();

    this.controls.minZoom = 0.1;
    this.controls.maxZoom = 10;

    if (transition) {
      this.startTransition(position, target, this.camera.up);
    } else {
      this.transition = null;
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.controls.update();
      this.requestRender();
    }
  }

  getCameraDirection(): THREE.Vector3 {
    return this.camera.getWorldDirection(new THREE.Vector3());
  }

  getCameraPosition(): THREE.Vector3 {
    return this.camera.position.clone();
  }

  getCameraRevision(): number {
    return this.cameraRevision;
  }

  getCameraUp(): THREE.Vector3 {
    return this.camera.up.clone();
  }

  getCameraZoom(): number {
    return this.camera.zoom;
  }

  getMaxAnisotropy(): number {
    return this.renderer.capabilities.getMaxAnisotropy();
  }

  getPixelRatio(): number {
    return this.pixelRatio;
  }

  getScreenBounds(): DOMRect {
    return this.canvas.getBoundingClientRect();
  }

  projectToScreen(
    position: THREE.Vector3,
    bounds = this.canvas.getBoundingClientRect(),
    result: { depth: number; x: number; y: number } = { depth: 0, x: 0, y: 0 },
  ): { depth: number; x: number; y: number } {
    this.projectedPosition.copy(position).project(this.camera);

    result.depth = this.projectedPosition.z;
    result.x = bounds.left + ((this.projectedPosition.x + 1) / 2) * bounds.width;
    result.y = bounds.top + ((1 - this.projectedPosition.y) / 2) * bounds.height;

    return result;
  }

  raycast(
    clientX: number,
    clientY: number,
    objects: readonly THREE.Object3D[],
    firstHitOnly = false,
  ): THREE.Intersection[] {
    const bounds = this.canvas.getBoundingClientRect();

    const pointer = new THREE.Vector2(
      ((clientX - bounds.left) / bounds.width) * 2 - 1,
      -((clientY - bounds.top) / bounds.height) * 2 + 1,
    );

    this.raycaster.setFromCamera(pointer, this.camera);
    this.raycaster.firstHitOnly = firstHitOnly;

    return this.raycaster.intersectObjects([...objects], true);
  }

  renderImmediately(): void {
    if (this.disposed) return;

    for (const listener of this.beforeRender) listener();
    this.renderer.render(this.scene, this.camera);
  }

  requestRender = (): void => {
    if (this.disposed || this.renderScheduled || this.paused) return;

    this.renderScheduled = true;

    this.renderFrame = requestAnimationFrame((time) => {
      this.renderFrame = null;
      this.renderScheduled = false;
      if (this.disposed) return;

      this.updateCamera(time);

      this.updateLightTransforms();

      for (const listener of this.beforeRender) listener();

      this.renderer.render(this.scene, this.camera);

      if (this.autoRotationEnabled || this.transition) {
        this.requestRender();
      }
    });
  };

  resetBounds(bounds: THREE.Box3, transition = false): void {
    if (bounds.isEmpty()) return;

    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const radius = Math.max(sphere.radius, Number.EPSILON);
    const distance = radius * CAMERA_DISTANCE_FACTOR;
    const target = sphere.center.clone();
    const position = new THREE.Vector3(...UI_CAMERA_DIRECTIONS.isometric)
      .normalize()
      .applyQuaternion(this.frameRotation)
      .multiplyScalar(distance)
      .add(target);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.frameRotation);

    this.frameDistance = distance;
    this.frameRadius = radius;
    this.frameHalfHeight = this.halfHeightForRadius(radius);
    this.camera.near = Math.max(radius / 50, 0.001);
    this.camera.far = Math.max(radius * 25, 1000);
    this.camera.zoom = 1;
    this.updateFrustum();
    this.camera.updateProjectionMatrix();
    this.controls.minZoom = 0.1;
    this.controls.maxZoom = 10;

    if (transition) {
      this.startTransition(position, target, up);
      return;
    }

    this.transition = null;
    this.camera.position.copy(position);
    this.camera.up.copy(up);
    this.controls.target.copy(target);
    this.controls.update();
    this.requestRender();
  }

  resize(width = this.canvas.clientWidth, height = this.canvas.clientHeight): void {
    width = Math.max(Math.round(width), 1);
    height = Math.max(Math.round(height), 1);

    const pixelRatio = Math.min(window.devicePixelRatio, 2);

    if (width === this.width && height === this.height && pixelRatio === this.pixelRatio) {
      return;
    }

    this.width = width;
    this.height = height;
    this.pixelRatio = pixelRatio;

    if (this.frameRadius > 0) {
      this.frameHalfHeight = this.halfHeightForRadius(this.frameRadius);
    }

    this.updateFrustum();
    this.applyBottomInset();
    this.camera.updateProjectionMatrix();

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);
    this.cameraRevision++;

    if (this.paused) return;

    this.renderImmediately();
  }

  rotateFrame(axis: 'x' | 'y' | 'z', degrees: number): void {
    const delta = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0),
      THREE.MathUtils.degToRad(degrees),
    );
    this.frameRotation.premultiply(delta);
    this.transition = null;

    const offset = this.camera.position.clone().sub(this.controls.target).applyQuaternion(delta);
    this.camera.position.copy(this.controls.target).add(offset);
    this.camera.up.applyQuaternion(delta).normalize();
    this.controls.update();
    this.requestRender();
  }

  setAutoRotation(enabled: boolean): void {
    this.autoRotationEnabled = enabled;
    this.lastFrameTime = null;
    this.requestRender();
  }

  setCameraAngle(angle: UICameraAngle): void {
    const direction = new THREE.Vector3(...UI_CAMERA_DIRECTIONS[angle])
      .normalize()
      .applyQuaternion(this.frameRotation);
    const target = this.controls.target.clone();
    const position = target.clone().addScaledVector(direction, this.frameDistance);

    const up = new THREE.Vector3(
      0,
      angle === 'top' || angle === 'bottom' ? 0 : 1,
      angle === 'top' ? -1 : angle === 'bottom' ? 1 : 0,
    ).applyQuaternion(this.frameRotation);

    this.startTransition(position, target, up);
  }

  setControlsEnabled(enabled: boolean): void {
    this.controls.setEnabled(enabled);
  }

  setPaused(paused: boolean): void {
    if (this.paused === paused) return;

    this.paused = paused;

    if (paused) {
      if (this.renderFrame !== null) {
        cancelAnimationFrame(this.renderFrame);
        this.renderFrame = null;
      }
      this.renderScheduled = false;
    } else {
      this.requestRender();
    }
  }

  subscribeBeforeRender(listener: () => void): () => void {
    this.beforeRender.add(listener);
    return () => this.beforeRender.delete(listener);
  }

  updateLighting(bounds: THREE.Box3): void {
    if (bounds.isEmpty()) return;

    this.lightingBounds = bounds.clone();
    this.updateLightTransforms();
    this.requestRender();
  }

  worldHeightForPixels(pixels: number): number {
    const visibleHeight = Math.max(this.height - this.bottomInset, 1);
    const worldHeight = (this.camera.top - this.camera.bottom) / this.camera.zoom;

    return (worldHeight * pixels) / visibleHeight;
  }

  worldPosition(position: Vector3): THREE.Vector3 {
    return new THREE.Vector3(...position);
  }

  private applyBottomInset(): void {
    const inset = Math.min(this.bottomInset, Math.max(this.height - 1, 0));

    if (inset === 0) {
      this.camera.clearViewOffset();
      return;
    }

    this.camera.setViewOffset(this.width, this.height, 0, inset / 2, this.width, this.height);
  }

  private halfHeightForRadius(radius: number): number {
    const visibleHeight = Math.max(this.height - this.bottomInset, 1);

    const heightConstraint = (radius * this.height) / visibleHeight;
    const widthConstraint = (radius * this.height) / this.width;

    return Math.max(heightConstraint, widthConstraint);
  }

  private handleControlsChange = (): void => {
    this.cameraRevision++;
    this.requestRender();
  };

  private startTransition(position: THREE.Vector3, target: THREE.Vector3, up: THREE.Vector3): void {
    const fromTarget = this.controls.target.clone();

    this.transition = {
      fromDistance: this.camera.position.distanceTo(fromTarget),
      fromQuaternion: this.camera.quaternion.clone(),
      fromTarget,
      lastTime: performance.now(),
      progress: 0,
      toQuaternion: new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(position, target, up),
      ),
      toTarget: target.clone(),
      toUp: up.clone(),
      velocity: 0,
    };

    this.requestRender();
  }

  private updateCamera(time: number): void {
    if (this.transition) {
      const dt = Math.min((time - this.transition.lastTime) / 1000, 1 / 30);
      this.transition.lastTime = time;

      const stiffness = 350;
      const damping = 38;
      const acceleration =
        stiffness * (1 - this.transition.progress) - damping * this.transition.velocity;
      this.transition.velocity += acceleration * dt;
      this.transition.progress += this.transition.velocity * dt;

      const settled =
        Math.abs(1 - this.transition.progress) < 0.001 &&
        Math.abs(this.transition.velocity) < 0.001;
      const eased = settled ? 1 : this.transition.progress;

      this.controls.target.lerpVectors(this.transition.fromTarget, this.transition.toTarget, eased);
      this.camera.quaternion.slerpQuaternions(
        this.transition.fromQuaternion,
        this.transition.toQuaternion,
        eased,
      );
      this.camera.position
        .set(0, 0, 1)
        .applyQuaternion(this.camera.quaternion)
        .multiplyScalar(
          THREE.MathUtils.lerp(this.transition.fromDistance, this.frameDistance, eased),
        )
        .add(this.controls.target);

      if (settled) {
        this.camera.up.copy(this.transition.toUp);
        this.transition = null;
      }

      this.cameraRevision++;

      return;
    }

    if (!this.autoRotationEnabled) {
      this.lastFrameTime = null;
      return;
    }

    const elapsed =
      this.lastFrameTime === null ? 0 : Math.min((time - this.lastFrameTime) / 1000, 0.1);

    this.lastFrameTime = time;

    const axis = new THREE.Vector3(0, 1, 0);
    const angle = (Math.PI * 2 * 15 * elapsed) / 60;

    this.camera.position
      .sub(this.controls.target)
      .applyAxisAngle(axis, angle)
      .add(this.controls.target);
    this.camera.up.applyAxisAngle(axis, angle);

    this.camera.lookAt(this.controls.target);
    this.cameraRevision++;
  }

  private updateFrustum(): void {
    const aspect = this.width / this.height;
    const halfWidth = this.frameHalfHeight * aspect;

    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.top = this.frameHalfHeight;
    this.camera.bottom = -this.frameHalfHeight;
  }

  private updateLightTransforms(): void {
    if (!this.lightingBounds || this.lightingBounds.isEmpty()) return;

    const sphere = this.lightingBounds.getBoundingSphere(new THREE.Sphere());
    const radius = Math.max(sphere.radius, 0.01);
    const center = sphere.center;

    // OCCT marks both preview directional lights as headlights. Express the
    // native source directions in the current camera basis so rotating the
    // model preserves the same view-relative illumination.
    const viewDirection = this.camera.getWorldDirection(new THREE.Vector3()).normalize();
    const viewUp = this.camera.up.clone().normalize();
    const viewRight = new THREE.Vector3().crossVectors(viewDirection, viewUp).normalize();
    const viewBack = viewDirection.clone().negate();

    const keyDirection = viewRight
      .clone()
      .multiplyScalar(0.45)
      .addScaledVector(viewUp, 0.65)
      .add(viewBack)
      .normalize();
    this.keyLight.position.copy(center).addScaledVector(keyDirection, radius * 3);
    this.keyLight.target.position.copy(center);
    this.keyLight.target.updateMatrixWorld();

    const shadowExtent = radius * 1.4;
    const shadowCamera = this.keyLight.shadow.camera;
    shadowCamera.left = -shadowExtent;
    shadowCamera.right = shadowExtent;
    shadowCamera.top = shadowExtent;
    shadowCamera.bottom = -shadowExtent;
    shadowCamera.near = radius * 0.5;
    shadowCamera.far = radius * 7;
    shadowCamera.updateProjectionMatrix();
    this.keyLight.shadow.normalBias = Math.max(radius * 0.001, 0.00005);

    const fillDirection = viewRight
      .multiplyScalar(-0.65)
      .addScaledVector(viewUp, -0.25)
      .add(viewBack)
      .normalize();
    this.fillLight.position.copy(center).addScaledVector(fillDirection, radius * 3);
    this.fillLight.target.position.copy(center);
    this.fillLight.target.updateMatrixWorld();
  }
}
