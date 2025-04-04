document.addEventListener('DOMContentLoaded', () => {
    const htmlUploadInput = document.getElementById('html-upload');
    const htmlPreview = document.getElementById('html-preview');
    const editorSection = document.getElementById('editor-section');
    const downloadSection = document.getElementById('download-section');
    const downloadBtn = document.getElementById('download-btn');

    // HTML ファイルのアップロード処理
    htmlUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const htmlContent = e.target.result;
            
            // HTMLコンテンツをプレビューエリアに表示
            htmlPreview.innerHTML = htmlContent;
            
            // バナーコンテナのサイズを検出して適用
            detectAndApplyBannerSize();
            
            // 画像要素を特定して編集ボタンを追加
            prepareImagesForEditing();
            
            // 背景画像を持つ要素を特定して編集ボタンを追加
            prepareBackgroundImagesForEditing();
            
            // エディタと保存セクションを表示
            editorSection.style.display = 'block';
            downloadSection.style.display = 'block';
        };
        reader.readAsText(file);
    });

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
                    
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        img.src = e.target.result;
                        document.body.removeChild(fileInput);
                    };
                    reader.readAsDataURL(file);
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
                            element.style.backgroundImage = `url(${e.target.result})`;
                            document.body.removeChild(fileInput);
                        };
                        reader.readAsDataURL(file);
                    });
                    
                    fileInput.click();
                });
            }
        });
    }

    // 画像としてダウンロードする処理
    downloadBtn.addEventListener('click', () => {
        // 編集ボタンを非表示にしてから画像をキャプチャ
        const editButtons = htmlPreview.querySelectorAll('.image-upload-btn');
        editButtons.forEach(btn => btn.style.display = 'none');
        
        // サイズ情報を非表示
        const sizeInfo = document.querySelector('.size-info');
        if (sizeInfo) sizeInfo.style.display = 'none';
        
        html2canvas(htmlPreview).then(canvas => {
            // 編集ボタンを再表示
            editButtons.forEach(btn => btn.style.display = 'block');
            
            // サイズ情報を再表示
            if (sizeInfo) sizeInfo.style.display = 'block';
            
            // キャンバスを画像に変換してダウンロード
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = 'edited-html.png';
            link.click();
        });
    });
}); 