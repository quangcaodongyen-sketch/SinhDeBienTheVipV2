/**
 * Device Fingerprinting & Anti-Abuse Registration Service
 * Nhận diện thiết bị đa lớp chống đăng ký lạm dụng tài khoản dùng thử
 */

const FINGERPRINT_KEY = 'examcraft_device_id';
const LOCAL_REG_KEY = 'examcraft_device_registered';
const SYS_REG_KEY = 'sys_db_device_registered';
const COOKIE_NAME = 'device_registered';
const IDB_NAME = 'sys_kernel_db';
const IDB_STORE = 'device_flags';

/**
 * Tạo chuỗi hash nhanh từ chuỗi đầu vào
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Lấy Canvas Fingerprint
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'nocanvas';

    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial", sans-serif';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('SinhDeBienTheVip-2026', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Thầy Đinh Văn Thành', 4, 17);

    return simpleHash(canvas.toDataURL());
  } catch (e) {
    return 'canvas_err';
  }
}

/**
 * Lấy WebGL Fingerprint
 */
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return 'nowebgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'nowebgldebug';

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
    return simpleHash(`${vendor}~${renderer}`);
  } catch (e) {
    return 'webgl_err';
  }
}

/**
 * Lấy mã định danh phần cứng/trình duyệt của thiết bị (Device Fingerprint)
 */
export async function getDeviceFingerprint(): Promise<string> {
  const existingId = localStorage.getItem(FINGERPRINT_KEY);
  if (existingId) return existingId;

  const canvasHash = getCanvasFingerprint();
  const webglHash = getWebGLFingerprint();
  const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}@${window.devicePixelRatio || 1}`;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const lang = navigator.language || '';
  const hardwareConcurrency = navigator.hardwareConcurrency || 2;
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';

  const rawString = `${canvasHash}|${webglHash}|${screenInfo}|${timeZone}|${lang}|${hardwareConcurrency}|${platform}`;
  const deviceId = `DEV_${simpleHash(rawString)}_${Math.random().toString(36).substring(2, 7)}`;

  localStorage.setItem(FINGERPRINT_KEY, deviceId);
  return deviceId;
}

/**
 * Kiểm tra xem thiết bị này đã từng đăng ký tài khoản dùng thử hay chưa
 */
export async function isDeviceRegistered(): Promise<boolean> {
  // 1. Kiểm tra LocalStorage
  if (localStorage.getItem(LOCAL_REG_KEY) === 'true') return true;
  if (localStorage.getItem(SYS_REG_KEY) === 'true') return true;

  // 2. Kiểm tra Cookie
  const cookies = document.cookie.split(';');
  for (const c of cookies) {
    if (c.trim().startsWith(`${COOKIE_NAME}=`)) return true;
  }

  // 3. Kiểm tra IndexedDB
  try {
    const idbResult = await new Promise<boolean>((resolve) => {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(IDB_STORE);
      };
      request.onsuccess = () => {
        const db = request.result;
        try {
          const tx = db.transaction(IDB_STORE, 'readonly');
          const store = tx.objectStore(IDB_STORE);
          const getReq = store.get('registered');
          getReq.onsuccess = () => {
            resolve(getReq.result === true);
          };
          getReq.onerror = () => resolve(false);
        } catch {
          resolve(false);
        }
      };
      request.onerror = () => resolve(false);
    });

    if (idbResult) return true;
  } catch (e) {
    // Ignore IndexedDB error
  }

  return false;
}

/**
 * Đánh dấu thiết bị đã đăng ký tài khoản dùng thử
 */
export async function markDeviceRegistered(username?: string): Promise<void> {
  const deviceId = await getDeviceFingerprint();

  // 1. Lưu LocalStorage
  localStorage.setItem(LOCAL_REG_KEY, 'true');
  localStorage.setItem(SYS_REG_KEY, 'true');
  if (username) {
    localStorage.setItem('examcraft_last_registered_user', username);
  }

  // 2. Lưu Cookie (10 năm)
  document.cookie = `${COOKIE_NAME}=true; max-age=315360000; path=/; SameSite=Lax`;

  // 3. Lưu IndexedDB
  try {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(IDB_STORE);
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(true, 'registered');
      tx.objectStore(IDB_STORE).put(deviceId, 'deviceId');
      if (username) tx.objectStore(IDB_STORE).put(username, 'username');
    };
  } catch (e) {
    // Ignore
  }
}
