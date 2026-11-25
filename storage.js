// 存檔放 IndexedDB 而不是 localStorage：GitHub Pages 上同一個帳號的所有遊戲共用一個網域，
// localStorage 那約 5MB 是大家一起分的；IndexedDB 的額度大得多，也不會擠到別的遊戲。
// 遊戲端要的是同步讀寫（開場就要讀永久資料、存檔後立刻刪檔），所以開場先把整個庫讀進記憶體，
// 之後讀走記憶體、寫入同時送進 IndexedDB。開不了 IndexedDB 的環境（少數無痕模式）照舊用 localStorage。
const SaveStore = (() => {
    const DB_NAME = 'undeadFrenzy';
    const STORE = 'kv';
    // 有些 Safari 版本 indexedDB.open 會永遠不回應，等太久就當作開不了
    const OPEN_TIMEOUT_MS = 3000;
    const cache = new Map();
    let db = null;

    function openDb() {
        return new Promise(resolve => {
            let settled = false;
            const finish = v => { if (!settled) { settled = true; resolve(v); } };
            setTimeout(() => finish(null), OPEN_TIMEOUT_MS);
            let req;
            try { req = indexedDB.open(DB_NAME, 1); } catch (e) { finish(null); return; }
            req.onupgradeneeded = () => req.result.createObjectStore(STORE);
            req.onsuccess = () => {
                if (settled) { req.result.close(); return; }
                finish(req.result);
            };
            req.onerror = req.onblocked = () => finish(null);
        });
    }
    function readAll(d) {
        return new Promise(resolve => {
            const tx = d.transaction(STORE, 'readonly');
            const store = tx.objectStore(STORE);
            const keysReq = store.getAllKeys();
            const valsReq = store.getAll();
            tx.oncomplete = () => {
                keysReq.result.forEach((k, i) => cache.set(k, valsReq.result[i]));
                resolve(true);
            };
            tx.onerror = tx.onabort = () => resolve(false);
        });
    }
    function write(fn) {
        return new Promise(resolve => {
            const tx = db.transaction(STORE, 'readwrite');
            fn(tx.objectStore(STORE));
            tx.oncomplete = () => resolve(true);
            tx.onerror = tx.onabort = () => { console.warn('SaveStore write failed', tx.error); resolve(false); };
        });
    }

    const ready = openDb().then(async d => {
        if (d && await readAll(d)) db = d;
    });

    return {
        ready,
        get(key) {
            if (!db) { try { return localStorage.getItem(key); } catch (e) { return null; } }
            return cache.has(key) ? cache.get(key) : null;
        },
        set(key, value) {
            if (!db) { localStorage.setItem(key, value); return; }
            cache.set(key, value);
            write(s => s.put(value, key));
        },
        remove(key) {
            if (!db) { try { localStorage.removeItem(key); } catch (e) { } return; }
            cache.delete(key);
            write(s => s.delete(key));
        },
        // 舊版存在 localStorage 的資料搬進來，寫進去確定成功了才從 localStorage 刪掉，騰出空間給同網域的其他遊戲
        async adopt(keys) {
            if (!db) return;
            let legacy;
            try { legacy = keys.map(k => [k, localStorage.getItem(k)]).filter(([, v]) => v !== null); } catch (e) { return; }
            if (!legacy.length) return;
            const fresh = legacy.filter(([k]) => !cache.has(k));
            fresh.forEach(([k, v]) => cache.set(k, v));
            if (fresh.length && !await write(s => fresh.forEach(([k, v]) => s.put(v, k)))) return;
            legacy.forEach(([k]) => { try { localStorage.removeItem(k); } catch (e) { } });
        },
    };
})();
