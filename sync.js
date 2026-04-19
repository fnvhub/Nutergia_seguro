// ============================================================
// SYNC MODULE — Nutergia Seguro
// Sincroniza productos entre localStorage y Firestore
// Opción B: Descarga al abrir, sube al guardar
// ============================================================

const SYNC_COLLECTION = 'appData';
const SYNC_DOC_ID = 'productos';
const SK = {
  productos: 'ns_productos',
  ultimaSync: 'ns_ultima_sync'
};

let db = null;
let syncEnabled = false;

// Esperar a que Firebase esté listo
window.addEventListener('firebaseReady', function() {
  db = window.firebaseDb;
  initSync();
});

function initSync() {
  console.log("🔄 Inicializando sincronización...");
  syncEnabled = true;
  
  // Al abrir la app: descargar datos de Firestore si son más nuevos
  loadFromFirestore();
  
  console.log("✓ Sincronización iniciada");
}

// ============================================================
// CARGAR DE FIRESTORE
// ============================================================
async function loadFromFirestore() {
  if (!db || !syncEnabled) return;
  
  try {
    const docRef = doc(db, SYNC_COLLECTION, SYNC_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const remoteData = docSnap.data();
      const remoteTimestamp = remoteData._lastSync || 0;
      const localTimestamp = parseInt(localStorage.getItem(SK.ultimaSync) || '0');
      
      // Si Firestore es más nuevo, descargar
      if (remoteTimestamp > localTimestamp) {
        console.log(`📥 Datos descargados de Firestore (${new Date(remoteTimestamp).toLocaleString('es-ES')})`);
        
        // Extraer productos (sin metadatos)
        const productosRemoto = remoteData.productos || [];
        
        // Actualizar estado global y localStorage
        if (window.state && typeof window.state === 'object') {
          window.state.productos = productosRemoto;
        }
        localStorage.setItem(SK.productos, JSON.stringify(productosRemoto));
        localStorage.setItem(SK.ultimaSync, remoteTimestamp.toString());
        
        // Disparar evento para que la UI se actualice
        window.dispatchEvent(new CustomEvent('datosActualizadosDesdeFirebase'));
        mostrarToast('📥 Datos sincronizados desde servidor');
      } else {
        console.log('✓ Los datos locales están actualizados');
      }
    } else {
      console.log('📄 Primera sincronización: subiendo datos locales a Firestore');
      // Subir los datos locales a Firestore
      subirAFirestore();
    }
  } catch (error) {
    console.error("❌ Error al cargar de Firestore:", error);
    mostrarToast('⚠️ No se pudo sincronizar. Modo offline.');
  }
}

// ============================================================
// SUBIR A FIRESTORE
// Llamar cuando se guarda un producto
// ============================================================
async function subirAFirestore() {
  if (!db || !syncEnabled) {
    console.warn('⚠️ Firestore no disponible. Guardado solo en local.');
    return false;
  }
  
  try {
    const productos = JSON.parse(localStorage.getItem(SK.productos) || '[]');
    const ahora = Date.now();
    
    const dataToSync = {
      productos: productos,
      _lastSync: ahora,
      _updatedAt: new Date().toISOString()
    };
    
    const docRef = doc(db, SYNC_COLLECTION, SYNC_DOC_ID);
    await setDoc(docRef, dataToSync, { merge: false });
    
    localStorage.setItem(SK.ultimaSync, ahora.toString());
    console.log("📤 Datos sincronizados a Firestore");
    
    return true;
  } catch (error) {
    console.error("❌ Error al subir a Firestore:", error);
    console.warn("⚠️ Los datos se guardaron localmente pero no se sincronizaron al servidor");
    return false;
  }
}

// ============================================================
// HOOK PARA GUARDAR PRODUCTO (llamar desde guardarProducto())
// ============================================================
async function syncAfterSave() {
  const resultado = await subirAFirestore();
  if (resultado) {
    mostrarToast('✅ Producto guardado y sincronizado');
  } else {
    mostrarToast('✅ Producto guardado (offline — se sincronizará después)');
  }
}

// ============================================================
// DETECTAR CAMBIOS DE CONECTIVIDAD
// ============================================================
window.addEventListener('online', function() {
  console.log("🌐 Conexión restaurada. Sincronizando...");
  subirAFirestore();
});

window.addEventListener('offline', function() {
  console.log("📵 Sin conexión. Los cambios se guardarán localmente.");
  mostrarToast('📵 Modo offline — cambios guardados localmente');
});

// ============================================================
// HELPER: mostrarToast (compatible con la app)
// ============================================================
function mostrarToast(msg, dur = 2500) {
  const t = document.getElementById('toast');
  if (!t) return; // Si no existe el elemento, ignorar
  t.textContent = msg;
  t.classList.add('visible');
  setTimeout(() => t.classList.remove('visible'), dur);
}

// Exponer funciones globalmente
window.syncAfterSave = syncAfterSave;
window.subirAFirestore = subirAFirestore;
