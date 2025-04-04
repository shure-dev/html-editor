document.addEventListener('DOMContentLoaded', () => {
    const htmlUploadInput = document.getElementById('html-upload');
    const htmlPreview = document.getElementById('html-preview');
    const editorSection = document.getElementById('editor-section');
    const downloadSection = document.getElementById('download-section');
    const downloadBtn = document.getElementById('download-btn');
    const imageModal = document.getElementById('image-modal');
    const closeButton = document.querySelector('.close-button');
    const imageUploadInput = document.getElementById('image-upload');
    const previewImage = document.getElementById('preview-image');
    const selectedFileName = document.getElementById('selected-file-name');
    const replaceButton = document.getElementById('replace-button');

    // Current target image element
    let currentImageElement = null;
    let currentImageFile = null;
    let currentImageDimensions = { width: null, height: null };

    // HTML ファイルのアップロード処理
    htmlUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const htmlContent = e.target.result;
            
            // Parse HTML content
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            
            // Make all images clickable
            const images = doc.querySelectorAll('img');
            images.forEach(img => {
                // Wrap image in a container to maintain its original dimensions
                const imgContainer = document.createElement('div');
                imgContainer.className = 'clickable-img';
                
                // Get the original image's computed styles
                const parent = img.parentNode;
                parent.insertBefore(imgContainer, img);
                imgContainer.appendChild(img);
                
                // Add click event to open image upload modal
                imgContainer.addEventListener('click', () => {
                    openImageModal(img);
                });
            });
            
            // Display the modified HTML
            htmlPreview.innerHTML = '';
            htmlPreview.appendChild(doc.documentElement);
            
            // Add event listeners to the newly added elements
            addClickListeners();
            
            // ダウンロードボタンを有効化
            downloadBtn.disabled = false;
        };
        reader.readAsText(file);
    });

    // Add click event listeners to images in preview
    function addClickListeners() {
        const clickableImages = htmlPreview.querySelectorAll('.clickable-img');
        clickableImages.forEach(container => {
            container.addEventListener('click', () => {
                const img = container.querySelector('img');
                openImageModal(img);
            });
        });
    }

    // Extract dimensions from placeholder URL
    function extractDimensionsFromSrc(src) {
        // Match dimensions like 500x300 or 505x1012 in URLs
        const dimensionMatch = src.match(/(\d+)x(\d+)/);
        if (dimensionMatch && dimensionMatch.length >= 3) {
            return {
                width: parseInt(dimensionMatch[1]),
                height: parseInt(dimensionMatch[2])
            };
        }
        return null;
    }

    // Open image upload modal
    function openImageModal(imageElement) {
        currentImageElement = imageElement;
        imageModal.style.display = 'block';
        
        // Reset the form
        imageUploadInput.value = '';
        previewImage.src = '';
        selectedFileName.textContent = '';
        replaceButton.disabled = true;
        
        // Extract dimensions from placeholder URL
        currentImageDimensions = extractDimensionsFromSrc(imageElement.src) || {
            width: imageElement.width || null,
            height: imageElement.height || null
        };
        
        // Show information about dimensions
        if (currentImageDimensions.width && currentImageDimensions.height) {
            selectedFileName.textContent = `元の画像サイズ: ${currentImageDimensions.width}x${currentImageDimensions.height}`;
        }
        
        // Show current image in preview
        if (imageElement.src) {
            previewImage.src = imageElement.src;
        }
    }

    // Close modal
    closeButton.addEventListener('click', () => {
        imageModal.style.display = 'none';
        currentImageElement = null;
        currentImageFile = null;
        currentImageDimensions = { width: null, height: null };
    });

    // Preview selected image
    imageUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        currentImageFile = file;
        
        // Show file name and original dimensions if available
        let dimensions = '';
        if (currentImageDimensions.width && currentImageDimensions.height) {
            dimensions = ` (${currentImageDimensions.width}x${currentImageDimensions.height}に調整されます)`;
        }
        selectedFileName.textContent = `${file.name}${dimensions}`;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            replaceButton.disabled = false;
        };
        reader.readAsDataURL(file);
    });

    // Replace image button click
    replaceButton.addEventListener('click', () => {
        if (!currentImageElement || !currentImageFile) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            // Create a new image to get the natural dimensions of the uploaded file
            const tempImg = new Image();
            tempImg.onload = () => {
                // Apply the image with original dimensions preserved
                currentImageElement.src = e.target.result;
                
                // If we have dimensions from the placeholder, apply them
                if (currentImageDimensions.width && currentImageDimensions.height) {
                    currentImageElement.style.width = `${currentImageDimensions.width}px`;
                    currentImageElement.style.height = `${currentImageDimensions.height}px`;
                    currentImageElement.style.objectFit = 'cover';
                }
                
                // Close the modal
                imageModal.style.display = 'none';
                
                // Reset current selections
                currentImageElement = null;
                currentImageFile = null;
                currentImageDimensions = { width: null, height: null };
            };
            tempImg.src = e.target.result;
        };
        reader.readAsDataURL(currentImageFile);
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === imageModal) {
            imageModal.style.display = 'none';
            currentImageElement = null;
            currentImageFile = null;
            currentImageDimensions = { width: null, height: null };
        }
    });

    // 画像の読み込み完了を待つ関数
    function waitForImagesLoaded() {
        return new Promise(resolve => {
            const images = htmlPreview.querySelectorAll('img');
            let loadedCount = 0;
            
            // 画像が存在しない場合はすぐに解決
            if (images.length === 0) {
                resolve();
                return;
            }
            
            // 各画像の読み込みを監視
            images.forEach(img => {
                if (img.complete) {
                    loadedCount++;
                    if (loadedCount === images.length) resolve();
                } else {
                    img.addEventListener('load', () => {
                        loadedCount++;
                        if (loadedCount === images.length) resolve();
                    });
                    
                    // エラー時も次に進めるために処理
                    img.addEventListener('error', () => {
                        console.error('画像の読み込みに失敗しました:', img.src);
                        loadedCount++;
                        if (loadedCount === images.length) resolve();
                    });
                }
            });
        });
    }

    // バナーコンテナのサイズを検出して適用する関数
    function detectAndApplyBannerSize() {
        // CSSスタイルを解析してバナーコンテナのサイズを検出
        const styleElements = htmlPreview.querySelectorAll('style');
        let containerWidth, containerHeight;
        
        styleElements.forEach(styleElement => {
            const cssText = styleElement.textContent;
            
            // 幅の検出
            const widthMatch = cssText.match(/#banner-container\s*{[^}]*width\s*:\s*([0-9]+)px/);
            if (widthMatch && widthMatch[1]) {
                containerWidth = parseInt(widthMatch[1]);
            }
            
            // 高さの検出
            const heightMatch = cssText.match(/#banner-container\s*{[^}]*height\s*:\s*([0-9]+)px/);
            if (heightMatch && heightMatch[1]) {
                containerHeight = parseInt(heightMatch[1]);
            }
        });
        
        // バナーコンテナのサイズが検出された場合、htmlPreviewのサイズを設定
        if (containerWidth && containerHeight) {
            htmlPreview.style.width = `${containerWidth}px`;
            htmlPreview.style.height = `${containerHeight}px`;
            htmlPreview.style.overflow = 'hidden';
            
            // サイズ情報を表示
            const sizeInfo = document.createElement('div');
            sizeInfo.className = 'size-info';
            sizeInfo.textContent = `検出されたサイズ: ${containerWidth}px × ${containerHeight}px`;
            htmlPreview.parentNode.insertBefore(sizeInfo, htmlPreview);
        }
    }

    // 画像要素に編集ボタンを追加する関数
    function prepareImagesForEditing() {
        const images = htmlPreview.querySelectorAll('img');
        images.forEach((img, index) => {
            // 画像を囲むコンテナを作成
            const container = document.createElement('div');
            container.className = 'image-container';
            img.parentNode.insertBefore(container, img);
            container.appendChild(img);
            
            // 画像のアップロードボタンを追加
            const uploadBtn = document.createElement('button');
            uploadBtn.className = 'image-upload-btn';
            uploadBtn.textContent = '画像変更';
            uploadBtn.dataset.imgIndex = index;
            container.appendChild(uploadBtn);
            
            // ボタンのクリックイベント
            uploadBtn.addEventListener('click', () => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.style.display = 'none';
                document.body.appendChild(fileInput);
                
                fileInput.addEventListener('change', (event) => {
                    const file = event.target.files[0];
                    if (!file) return;
                    
                    // 画像サイズチェック
                    checkImageDimensions(file).then(dimensions => {
                        if (dimensions.width > 5000 || dimensions.height > 5000) {
                            alert('画像のサイズが大きすぎます（5000px超）。表示に問題が生じる可能性があります。');
                        }
                        
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            // 元の画像サイズを記録
                            const originalWidth = img.width;
                            const originalHeight = img.height;
                            const originalStyle = img.getAttribute('style') || '';
                            const originalWidthAttr = img.getAttribute('width');
                            const originalHeightAttr = img.getAttribute('height');
                            
                            // 新しい画像のsrcを設定
                            img.src = e.target.result;
                            
                            // 元のサイズを適用
                            if (originalWidthAttr) img.setAttribute('width', originalWidthAttr);
                            if (originalHeightAttr) img.setAttribute('height', originalHeightAttr);
                            img.style = originalStyle;
                            if (!originalWidthAttr && !originalHeightAttr && !originalStyle.includes('width') && !originalStyle.includes('height')) {
                                img.width = originalWidth;
                                img.height = originalHeight;
                            }
                            
                            document.body.removeChild(fileInput);
                        };
                        reader.readAsDataURL(file);
                    });
                });
                
                fileInput.click();
            });
        });
    }

    // 背景画像を持つ要素を特定して編集ボタンを追加する関数
    function prepareBackgroundImagesForEditing() {
        const allElements = htmlPreview.querySelectorAll('*');
        allElements.forEach((element, index) => {
            const computedStyle = window.getComputedStyle(element);
            const backgroundImage = computedStyle.backgroundImage;
            
            // 背景画像を持つ要素を検出
            if (backgroundImage && backgroundImage !== 'none' && backgroundImage.includes('url')) {
                // 要素に相対位置を設定
                if (computedStyle.position === 'static') {
                    element.style.position = 'relative';
                }
                
                // 画像のアップロードボタンを追加
                const uploadBtn = document.createElement('button');
                uploadBtn.className = 'image-upload-btn';
                uploadBtn.textContent = '背景画像変更';
                uploadBtn.style.position = 'absolute';
                uploadBtn.style.top = '5px';
                uploadBtn.style.right = '5px';
                uploadBtn.dataset.bgIndex = index;
                element.appendChild(uploadBtn);
                
                // ボタンのクリックイベント
                uploadBtn.addEventListener('click', () => {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/*';
                    fileInput.style.display = 'none';
                    document.body.appendChild(fileInput);
                    
                    fileInput.addEventListener('change', (event) => {
                        const file = event.target.files[0];
                        if (!file) return;
                        
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            // 元の背景画像のスタイル情報を保存
                            const originalBgSize = computedStyle.backgroundSize;
                            const originalBgPosition = computedStyle.backgroundPosition;
                            const originalBgRepeat = computedStyle.backgroundRepeat;
                            
                            // 新しい背景画像を設定
                            element.style.backgroundImage = `url(${e.target.result})`;
                            
                            // 元のスタイル設定を適用
                            element.style.backgroundSize = originalBgSize;
                            element.style.backgroundPosition = originalBgPosition;
                            element.style.backgroundRepeat = originalBgRepeat;
                            
                            document.body.removeChild(fileInput);
                        };
                        reader.readAsDataURL(file);
                    });
                    
                    fileInput.click();
                });
            }
        });
    }

    // 画像のサイズをチェックする関数
    function checkImageDimensions(file) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = function() {
                URL.revokeObjectURL(img.src); // クリーンアップ
                resolve({ width: this.width, height: this.height });
            };
            img.src = URL.createObjectURL(file);
        });
    }

    // 画像としてダウンロードする処理
    downloadBtn.addEventListener('click', () => {
        if (!htmlPreview.innerHTML) {
            alert('HTMLファイルを先にアップロードしてください');
            return;
        }
        
        // クリッカブルな要素を一時的に非表示
        const clickableElements = htmlPreview.querySelectorAll('.clickable-img');
        clickableElements.forEach(el => {
            el.classList.add('capturing');
        });
        
        html2canvas(htmlPreview, {
            allowTaint: true,
            useCORS: true,
            scale: 2  // 高解像度でキャプチャ
        }).then(canvas => {
            // 非表示にした要素を元に戻す
            clickableElements.forEach(el => {
                el.classList.remove('capturing');
            });
            
            // 画像としてダウンロード
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = 'html-image.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }).catch(error => {
            console.error('画像生成エラー:', error);
            alert('画像の生成に失敗しました。しばらくしてからもう一度お試しください。');
            
            // 非表示にした要素を元に戻す
            clickableElements.forEach(el => {
                el.classList.remove('capturing');
            });
        });
    });
    
    // 初期状態ではダウンロードボタンを無効に
    downloadBtn.disabled = true;
}); 