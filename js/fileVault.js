/**
 * FileVault - 文件存储抽象层
 * 支持OPFS、localStorage存储和下载备份
 */
const FileVault = (() => {
    let isInitialized = false;
    let storageType = 'unknown'; // 'opfs', 'localStorage', 'download'
    let opfsDirectory = null;
    const FOLDER_NAME = 'BloomData';
    const STORAGE_PREFIX = 'bloom_vault_';
    
    // 初始化文件系统
    const initialize = async () => {
        if (isInitialized) {
            return storageType !== 'unknown';
        }
        
        try {
            // 尝试使用OPFS (Origin Private File System)
            if ('storage' in navigator && 'getDirectory' in navigator.storage) {
                console.log('尝试初始化OPFS...');
                const opfsRoot = await navigator.storage.getDirectory();
                opfsDirectory = await opfsRoot.getDirectoryHandle(FOLDER_NAME, { create: true });
                storageType = 'opfs';
                console.log('OPFS初始化成功');
            } else {
                console.log('OPFS不可用，使用localStorage存储');
                storageType = 'localStorage';
            }
        } catch (error) {
            console.warn('OPFS初始化失败:', error);
            storageType = 'localStorage';
        }
        
        isInitialized = true;
        return storageType !== 'unknown';
    };
    
    // 保存JSON数据
    const saveJSON = async (fileName, data) => {
        await initialize();
        
        const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        
        try {
            if (storageType === 'opfs' && opfsDirectory) {
                // 使用OPFS存储
                const fileHandle = await opfsDirectory.getFileHandle(fileName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(jsonString);
                await writable.close();
                console.log(`文件已保存到OPFS: ${fileName}`);
                return true;
            } else if (storageType === 'localStorage') {
                // 使用localStorage存储
                const storageKey = STORAGE_PREFIX + fileName;
                const fileData = {
                    content: jsonString,
                    lastModified: Date.now(),
                    size: new Blob([jsonString]).size
                };
                localStorage.setItem(storageKey, JSON.stringify(fileData));
                console.log(`文件已保存到localStorage: ${fileName}`);
                return true;
            } else {
                // 降级到下载
                downloadFallback(jsonString, fileName, 'application/json');
                return false;
            }
        } catch (error) {
            console.error('保存文件失败:', error);
            // 降级到下载
            downloadFallback(jsonString, fileName, 'application/json');
            return false;
        }
    };
    
    // 保存文本数据
    const saveText = async (fileName, text, mimeType = 'text/plain') => {
        await initialize();
        
        const textString = String(text);
        
        try {
            if (storageType === 'opfs' && opfsDirectory) {
                // 使用OPFS存储
                const fileHandle = await opfsDirectory.getFileHandle(fileName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(textString);
                await writable.close();
                console.log(`文本文件已保存到OPFS: ${fileName}`);
                return true;
            } else if (storageType === 'localStorage') {
                // 使用localStorage存储
                const storageKey = STORAGE_PREFIX + fileName;
                const fileData = {
                    content: textString,
                    lastModified: Date.now(),
                    size: new Blob([textString]).size,
                    mimeType: mimeType
                };
                localStorage.setItem(storageKey, JSON.stringify(fileData));
                console.log(`文本文件已保存到localStorage: ${fileName}`);
                return true;
            } else {
                // 降级到下载
                downloadFallback(textString, fileName, mimeType);
                return false;
            }
        } catch (error) {
            console.error('保存文本文件失败:', error);
            // 降级到下载
            downloadFallback(textString, fileName, mimeType);
            return false;
        }
    };
    
    // 列出所有文件
    const listFiles = async () => {
        await initialize();
        
        try {
            if (storageType === 'opfs' && opfsDirectory) {
                // 从OPFS读取文件列表
                const files = [];
                for await (const [name, handle] of opfsDirectory.entries()) {
                    if (handle.kind === 'file') {
                        const file = await handle.getFile();
                        files.push({
                            name: name,
                            size: file.size,
                            lastModified: file.lastModified
                        });
                    }
                }
                return files.sort((a, b) => b.lastModified - a.lastModified);
            } else if (storageType === 'localStorage') {
                // 从localStorage读取文件列表
                const files = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(STORAGE_PREFIX)) {
                        const fileName = key.substring(STORAGE_PREFIX.length);
                        try {
                            const fileData = JSON.parse(localStorage.getItem(key));
                            files.push({
                                name: fileName,
                                size: fileData.size || 0,
                                lastModified: fileData.lastModified || 0
                            });
                        } catch (error) {
                            console.warn(`解析文件数据失败: ${fileName}`, error);
                        }
                    }
                }
                return files.sort((a, b) => b.lastModified - a.lastModified);
            }
        } catch (error) {
            console.error('列出文件失败:', error);
        }
        
        return [];
    };
    
    // 读取文件内容
    const readFile = async (fileName) => {
        await initialize();
        
        try {
            if (storageType === 'opfs' && opfsDirectory) {
                // 从OPFS读取
                const fileHandle = await opfsDirectory.getFileHandle(fileName);
                const file = await fileHandle.getFile();
                return await file.text();
            } else if (storageType === 'localStorage') {
                // 从localStorage读取
                const storageKey = STORAGE_PREFIX + fileName;
                const fileData = JSON.parse(localStorage.getItem(storageKey));
                return fileData ? fileData.content : null;
            }
        } catch (error) {
            console.error('读取文件失败:', error);
        }
        
        return null;
    };
    
    // 删除文件
    const deleteFile = async (fileName) => {
        await initialize();
        
        try {
            if (storageType === 'opfs' && opfsDirectory) {
                // 从OPFS删除
                await opfsDirectory.removeEntry(fileName);
                return true;
            } else if (storageType === 'localStorage') {
                // 从localStorage删除
                const storageKey = STORAGE_PREFIX + fileName;
                localStorage.removeItem(storageKey);
                return true;
            }
        } catch (error) {
            console.error('删除文件失败:', error);
        }
        
        return false;
    };
    
    // 重命名文件
    const renameFile = async (oldName, newName) => {
        await initialize();
        
        try {
            // 先读取文件内容
            const content = await readFile(oldName);
            if (!content) {
                throw new Error('无法读取源文件');
            }
            
            // 保存为新文件名
            const saved = await saveJSON(newName, content);
            if (!saved) {
                throw new Error('保存新文件失败');
            }
            
            // 删除旧文件
            await deleteFile(oldName);
            return true;
        } catch (error) {
            console.error('重命名文件失败:', error);
            return false;
        }
    };
    
    // 检查是否可用（不依赖下载）
    const isAvailable = () => {
        return storageType === 'opfs' || storageType === 'localStorage';
    };
    
    // 获取文件夹名称
    const getFolderName = () => {
        return FOLDER_NAME;
    };
    
    // 下载降级备份
    const downloadFallback = (data, fileName, mimeType = 'application/json') => {
        try {
            const blob = new Blob([data], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
            
            console.log(`文件已下载: ${fileName}`);
        } catch (error) {
            console.error('下载失败:', error);
            throw error;
        }
    };
    
    // 格式化文件大小
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    // 格式化日期
    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    // 公开API
    return {
        initialize,
        saveJSON,
        saveText,
        listFiles,
        readFile,
        deleteFile,
        renameFile,
        isAvailable,
        getFolderName,
        formatFileSize,
        formatDate
    };
})();