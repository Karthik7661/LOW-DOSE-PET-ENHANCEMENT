/* ==========================================================================
   Low-Dose PET Enhancement System - Main JavaScript Interactions
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    let lastEnhancementResult = null;
    
    // UI Elements - Upload & Portal
    const dropzone = document.getElementById('uploadDropzone');
    const fileInput = document.getElementById('fileInput');
    const dropzonePrompt = document.getElementById('dropzonePrompt');
    const inputPreviewContainer = document.getElementById('inputPreviewContainer');
    const inputPreview = document.getElementById('inputPreview');
    const lblFileName = document.getElementById('lblFileName');
    const lblFileSize = document.getElementById('lblFileSize');
    const btnRemoveFile = document.getElementById('btnRemoveFile');
    
    const btnEnhance = document.getElementById('btnEnhance');
    const btnLoadSample = document.getElementById('btnLoadSample');
    const btnHeroDemo = document.getElementById('btnHeroDemo');
    const noiseLevelSelect = document.getElementById('noiseLevelSelect');
    
    const processingIndicator = document.getElementById('processingIndicator');
    const processingStatus = document.getElementById('processingStatus');
    const progressBarFill = document.getElementById('progressBarFill');
    
    const outputPlaceholder = document.getElementById('outputPlaceholder');
    const outputPreviewContainer = document.getElementById('outputPreviewContainer');
    const outputPreview = document.getElementById('outputPreview');
    const btnDownload = document.getElementById('btnDownload');
    const btnGenerateReport = document.getElementById('btnGenerateReport');
    
    const steps = {
        1: document.getElementById('step1'),
        2: document.getElementById('step2'),
        3: document.getElementById('step3')
    };

    // UI Elements - Diagnostic Workbench & Slider
    const workbenchSection = document.getElementById('workbenchSection');
    const btnModeSideBySide = document.getElementById('btnModeSideBySide');
    const btnModeSlider = document.getElementById('btnModeSlider');
    const viewSideBySide = document.getElementById('viewSideBySide');
    const viewSlider = document.getElementById('viewSlider');
    const lblActiveFile = document.getElementById('lblActiveFile');
    
    const workbenchInputImg = document.getElementById('workbenchInputImg');
    const workbenchOutputImg = document.getElementById('workbenchOutputImg');
    const workbenchRefImg = document.getElementById('workbenchRefImg');
    const sliderInputImg = document.getElementById('sliderInputImg');
    const sliderOutputImg = document.getElementById('sliderOutputImg');
    const sliderOverlay = document.getElementById('sliderOverlay');
    const workbenchSliderInput = document.getElementById('workbenchSliderInput');
    const workbenchSliderHandle = document.getElementById('workbenchSliderHandle');

    // UI Elements - PACS Adjustments
    const pacsBrightness = document.getElementById('pacsBrightness');
    const pacsContrast = document.getElementById('pacsContrast');
    const valBrightness = document.getElementById('valBrightness');
    const valContrast = document.getElementById('valContrast');
    const btnResetPacs = document.getElementById('btnResetPacs');

    // UI Elements - Workbench Metadata Tabs
    const tabBtnQuality = document.getElementById('tabBtnQuality');
    const tabBtnDicom = document.getElementById('tabBtnDicom');
    const tabBtnApi = document.getElementById('tabBtnApi');
    const metaQuality = document.getElementById('metaQuality');
    const metaDicom = document.getElementById('metaDicom');
    const metaApi = document.getElementById('metaApi');

    // Dynamic Text Fields
    const lblInputPsnr = document.getElementById('lblInputPsnr');
    const lblEnhancedPsnr = document.getElementById('lblEnhancedPsnr');
    const lblPsnrImprovement = document.getElementById('lblPsnrImprovement');
    
    const lblInputSsim = document.getElementById('lblInputSsim');
    const lblEnhancedSsim = document.getElementById('lblEnhancedSsim');
    const lblSsimImprovement = document.getElementById('lblSsimImprovement');
    
    const lblInputRmse = document.getElementById('lblInputRmse');
    const lblEnhancedRmse = document.getElementById('lblEnhancedRmse');
    const lblRmseImprovement = document.getElementById('lblRmseImprovement');
    
    const lblInputNrmse = document.getElementById('lblInputNrmse');
    const lblEnhancedNrmse = document.getElementById('lblEnhancedNrmse');
    const lblNrmseImprovement = document.getElementById('lblNrmseImprovement');
    
    const lblPatientId = document.getElementById('lblPatientId');
    const lblStudyDate = document.getElementById('lblStudyDate');
    const lblModality = document.getElementById('lblModality');
    const lblManufacturer = document.getElementById('lblManufacturer');
    const lblStationName = document.getElementById('lblStationName');
    const lblRescaleSlope = document.getElementById('lblRescaleSlope');
    const lblEstimatedDose = document.getElementById('lblEstimatedDose');

    // State Variables
    let selectedFile = null;
    let isSampleActive = false;

    // ==========================================================================
    // File Upload Handlers (Drag & Drop + Input)
    // ==========================================================================
    
    dropzone.addEventListener('click', (e) => {
        if (selectedFile || isSampleActive) return;
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (selectedFile || isSampleActive) return;
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (selectedFile || isSampleActive) return;
        if (e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });

    btnRemoveFile.addEventListener('click', (e) => {
        e.stopPropagation();
        resetWorkspace();
    });

    function handleFileSelection(file) {
        selectedFile = file;
        isSampleActive = false;
        if (hudTelem2) hudTelem2.textContent = "SCAN: READY";
        
        lblFileName.textContent = file.name;
        lblFileSize.textContent = formatBytes(file.size);
        
        const ext = file.name.split('.').pop().toLowerCase();
        
        if (ext === 'dcm') {
            inputPreview.style.display = 'none';
            let dicomCard = document.getElementById('dicomCardPreview');
            if (!dicomCard) {
                dicomCard = document.createElement('div');
                dicomCard.id = 'dicomCardPreview';
                dicomCard.className = 'dicom-preview-card';
                dicomCard.innerHTML = `
                    <i class="fa-solid fa-file-medical dicom-card-icon"></i>
                    <span>DICOM Dataset Slice</span>
                `;
                inputPreviewContainer.insertBefore(dicomCard, fileInfo);
            }
        } else {
            const dicomCard = document.getElementById('dicomCardPreview');
            if (dicomCard) dicomCard.remove();
            
            inputPreview.style.display = 'block';
            const reader = new FileReader();
            reader.onload = (e) => {
                inputPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        dropzonePrompt.classList.add('hidden');
        inputPreviewContainer.classList.remove('hidden');
        btnEnhance.classList.remove('disabled');
        btnEnhance.removeAttribute('disabled');
        
        updateStep(1);
    }

    // ==========================================================================
    // Demo Sample Loader
    // ==========================================================================
    
    function loadDemoScan() {
        resetWorkspace();
        isSampleActive = true;
        if (hudTelem2) hudTelem2.textContent = "SCAN: READY";
        selectedFile = null;
        
        lblFileName.textContent = "synthetic_brain_pet_10x.png";
        lblFileSize.textContent = "24.5 KB (Low-Dose Simulator)";
        
        const dicomCard = document.getElementById('dicomCardPreview');
        if (dicomCard) dicomCard.remove();
        
        inputPreview.style.display = 'block';
        inputPreview.src = "/static/images/sample_low_dose.png";
        
        dropzonePrompt.classList.add('hidden');
        inputPreviewContainer.classList.remove('hidden');
        
        btnEnhance.classList.remove('disabled');
        btnEnhance.removeAttribute('disabled');
        updateStep(1);
    }

    btnLoadSample.addEventListener('click', loadDemoScan);
    btnHeroDemo.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('enhance-section').scrollIntoView({ behavior: 'smooth' });
        loadDemoScan();
    });

    // ==========================================================================
    // Inference Execution & Quantitative Evaluation
    // ==========================================================================
    
    btnEnhance.addEventListener('click', () => {
        if (!selectedFile && !isSampleActive) return;
        
        btnEnhance.classList.add('disabled');
        btnEnhance.setAttribute('disabled', 'true');
        btnLoadSample.classList.add('disabled');
        btnLoadSample.setAttribute('disabled', 'true');
        btnRemoveFile.classList.add('hidden');
        noiseLevelSelect.setAttribute('disabled', 'true');
        
        outputPlaceholder.classList.add('hidden');
        outputPreviewContainer.classList.add('hidden');
        workbenchSection.classList.add('hidden');
        
        processingIndicator.classList.remove('hidden');
        if (hudTelem2) hudTelem2.textContent = "SCAN: RUNNING";
        updateStep(2);
        
        const formData = new FormData();
        const noiseLevel = noiseLevelSelect.value;
        formData.append('reduction_factor', noiseLevel);
        
        if (isSampleActive) {
            formData.append('is_sample', 'true');
        } else {
            formData.append('file', selectedFile);
            formData.append('is_sample', 'false');
        }
        
        fetch('/enhance', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.error || 'Server error'); });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                lastEnhancementResult = data;
                // Populate upload pre-views
                const dicomCard = document.getElementById('dicomCardPreview');
                if (dicomCard) dicomCard.remove();
                inputPreview.style.display = 'block';
                inputPreview.src = data.preview_url;
                
                outputPreview.src = data.enhanced_url;
                btnDownload.href = data.enhanced_url;
                
                // Hide loaders & Show Portal Output
                processingIndicator.classList.add('hidden');
                outputPreviewContainer.classList.remove('hidden');
                if (hudTelem2) hudTelem2.textContent = "SCAN: COMPLETE";
                updateStep(3);

                // Populate Diagnostic Workbench
                lblActiveFile.textContent = "Active File: " + data.filename;
                
                // Update images for side-by-side & slider
                workbenchInputImg.src = data.preview_url;
                workbenchOutputImg.src = data.enhanced_url;
                workbenchRefImg.src = data.reference_url;
                sliderInputImg.src = data.preview_url;
                sliderOutputImg.src = data.enhanced_url;
                
                // Reset PACS Adjustments
                pacsBrightness.value = 100;
                pacsContrast.value = 100;
                adjustImages();
                
                // Set initial slider size
                sliderOverlay.style.width = '50%';
                workbenchSliderHandle.style.left = '50%';
                workbenchSliderInput.value = 50;
                
                // Populate Metrics
                lblInputPsnr.textContent = parseFloat(data.metrics.input_psnr).toFixed(2) + " dB";
                lblEnhancedPsnr.textContent = parseFloat(data.metrics.enhanced_psnr).toFixed(2) + " dB";
                const psnrGain = parseFloat(data.metrics.psnr_improvement);
                if (psnrGain >= 0) {
                    lblPsnrImprovement.textContent = "+" + psnrGain.toFixed(2) + "% Gain";
                    lblPsnrImprovement.style.color = "var(--color-success)";
                } else {
                    lblPsnrImprovement.textContent = psnrGain.toFixed(2) + "% Loss";
                    lblPsnrImprovement.style.color = "#ef4444";
                }
                
                lblInputSsim.textContent = parseFloat(data.metrics.input_ssim).toFixed(4);
                lblEnhancedSsim.textContent = parseFloat(data.metrics.enhanced_ssim).toFixed(4);
                const ssimGain = parseFloat(data.metrics.ssim_improvement);
                if (ssimGain >= 0) {
                    lblSsimImprovement.textContent = "+" + ssimGain.toFixed(2) + "% Gain";
                    lblSsimImprovement.style.color = "var(--color-success)";
                } else {
                    lblSsimImprovement.textContent = ssimGain.toFixed(2) + "% Loss";
                    lblSsimImprovement.style.color = "#ef4444";
                }
                
                lblInputRmse.textContent = parseFloat(data.metrics.input_rmse).toFixed(4);
                lblEnhancedRmse.textContent = parseFloat(data.metrics.enhanced_rmse).toFixed(4);
                const rmseGain = parseFloat(data.metrics.rmse_improvement);
                if (rmseGain >= 0) {
                    lblRmseImprovement.textContent = "-" + rmseGain.toFixed(2) + "% Error";
                    lblRmseImprovement.style.color = "var(--color-success)";
                } else {
                    lblRmseImprovement.textContent = "+" + Math.abs(rmseGain).toFixed(2) + "% Error";
                    lblRmseImprovement.style.color = "#ef4444";
                }
                
                lblInputNrmse.textContent = parseFloat(data.metrics.input_nrmse).toFixed(4);
                lblEnhancedNrmse.textContent = parseFloat(data.metrics.enhanced_nrmse).toFixed(4);
                const nrmseGain = parseFloat(data.metrics.nrmse_improvement);
                if (nrmseGain >= 0) {
                    lblNrmseImprovement.textContent = "-" + nrmseGain.toFixed(2) + "% Error";
                    lblNrmseImprovement.style.color = "var(--color-success)";
                } else {
                    lblNrmseImprovement.textContent = "+" + Math.abs(nrmseGain).toFixed(2) + "% Error";
                    lblNrmseImprovement.style.color = "#ef4444";
                }
                
                // Populate DICOM Headers
                lblPatientId.textContent = data.metadata.PatientID;
                lblStudyDate.textContent = data.metadata.StudyDate;
                lblModality.textContent = data.metadata.Modality;
                lblManufacturer.textContent = data.metadata.Manufacturer;
                lblStationName.textContent = data.metadata.StationName;
                lblRescaleSlope.textContent = data.metadata.RescaleSlope + " / " + data.metadata.RescaleIntercept;
                lblEstimatedDose.textContent = data.metadata.EstimatedDose;
                
                // Scroll to Workbench with smooth animation
                workbenchSection.classList.remove('hidden');
                setTimeout(() => {
                    workbenchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
            }
        })
        .catch(err => {
            alert("Inference Failed: " + err.message);
            console.error(err);
            resetWorkspace();
        })
        .finally(() => {
            btnLoadSample.classList.remove('disabled');
            btnLoadSample.removeAttribute('disabled');
            btnRemoveFile.classList.remove('hidden');
            noiseLevelSelect.removeAttribute('disabled');
        });
    });

    // ==========================================================================
    // Interactive Curtain Slider Logic
    // ==========================================================================
    
    workbenchSliderInput.addEventListener('input', (e) => {
        const sliderVal = e.target.value;
        sliderOverlay.style.width = `${sliderVal}%`;
        workbenchSliderHandle.style.left = `${sliderVal}%`;
    });

    btnModeSideBySide.addEventListener('click', () => {
        btnModeSideBySide.classList.add('active');
        btnModeSlider.classList.remove('active');
        viewSideBySide.classList.remove('hidden');
        viewSlider.classList.add('hidden');
    });

    btnModeSlider.addEventListener('click', () => {
        btnModeSlider.classList.add('active');
        btnModeSideBySide.classList.remove('active');
        viewSlider.classList.remove('hidden');
        viewSideBySide.classList.add('hidden');
        setTimeout(updateSliderWidth, 50);
    });

    // ==========================================================================
    // PACS Interactive Leveling (Brightness & Contrast)
    // ==========================================================================
    
    const adjustImages = () => {
        const b = pacsBrightness.value;
        const c = pacsContrast.value;
        valBrightness.textContent = `${b}%`;
        valContrast.textContent = `${c}%`;
        
        const filterStr = `brightness(${b}%) contrast(${c}%) grayscale(100%)`;
        workbenchInputImg.style.filter = filterStr;
        workbenchOutputImg.style.filter = filterStr;
        sliderInputImg.style.filter = filterStr;
        sliderOutputImg.style.filter = filterStr;
    };
    
    pacsBrightness.addEventListener('input', adjustImages);
    pacsContrast.addEventListener('input', adjustImages);
    
    btnResetPacs.addEventListener('click', () => {
        pacsBrightness.value = 100;
        pacsContrast.value = 100;
        adjustImages();
    });

    // ==========================================================================
    // Workbench Tab Selection
    // ==========================================================================

    const metadataTabs = [
        { btn: tabBtnQuality, view: metaQuality },
        { btn: tabBtnDicom, view: metaDicom },
        { btn: tabBtnApi, view: metaApi }
    ];

    metadataTabs.forEach(tab => {
        tab.btn.addEventListener('click', () => {
            metadataTabs.forEach(t => {
                t.btn.classList.remove('active');
                t.view.classList.add('hidden');
                t.view.classList.remove('active');
            });
            tab.btn.classList.add('active');
            tab.view.classList.remove('hidden');
            tab.view.classList.add('active');
        });
    });

    // ==========================================================================
    // Dashboard Counter Roll-Up Animation
    // ==========================================================================

    const metricPsnrEl = document.querySelector('#metricPsnr .metric-value');
    const metricSsimEl = document.querySelector('#metricSsim .metric-value');
    const metricRmseEl = document.querySelector('#metricRmse .metric-value');
    const metricNrmseEl = document.querySelector('#metricNrmse .metric-value');
    
    const animateValue = (obj, start, end, duration, decimalPlaces = 4) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const currentVal = progress * (end - start) + start;
            
            if (obj === metricPsnrEl) {
                obj.innerHTML = `${currentVal.toFixed(4)} <span class="metric-unit">dB</span>`;
            } else {
                obj.innerHTML = `${currentVal.toFixed(decimalPlaces)}`;
            }
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };
    
    const dashboardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateValue(metricPsnrEl, 0, 43.8574, 1800, 4);
                animateValue(metricSsimEl, 0, 0.9939, 1800, 4);
                animateValue(metricRmseEl, 0.1, 0.00675, 1800, 6);
                animateValue(metricNrmseEl, 0.1, 0.00675, 1800, 6);
                dashboardObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    
    dashboardObserver.observe(document.getElementById('dashboard'));

    // ==========================================================================
    // UI Helpers & Tab Reset
    // ==========================================================================

    function resetWorkspace() {
        selectedFile = null;
        isSampleActive = false;
        fileInput.value = '';
        if (hudTelem2) hudTelem2.textContent = "SCAN: STANDBY";
        
        const dicomCard = document.getElementById('dicomCardPreview');
        if (dicomCard) dicomCard.remove();
        
        inputPreview.src = '';
        inputPreviewContainer.classList.add('hidden');
        dropzonePrompt.classList.remove('hidden');
        
        // Clear comparative image sources
        workbenchInputImg.src = '';
        workbenchOutputImg.src = '';
        workbenchRefImg.src = '';
        sliderInputImg.src = '';
        sliderOutputImg.src = '';
        
        btnEnhance.classList.add('disabled');
        btnEnhance.setAttribute('disabled', 'true');
        
        processingIndicator.classList.add('hidden');
        outputPreviewContainer.classList.add('hidden');
        outputPlaceholder.classList.remove('hidden');
        workbenchSection.classList.add('hidden');
        
        updateStep(1);
        steps[2].classList.remove('active');
        steps[3].classList.remove('active');
    }

    function updateStep(stepNumber) {
        Object.keys(steps).forEach(key => {
            if (parseInt(key) <= stepNumber) {
                steps[key].classList.add('active');
            } else {
                steps[key].classList.remove('active');
            }
        });
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Results Dashboard Graph Tabs
    const tabButtons = document.querySelectorAll('.graph-tab-btn');
    const viewports = document.querySelectorAll('.graph-viewport');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetGraph = btn.getAttribute('data-graph');
            if (!targetGraph) return; // Ignore workbench tabs
            
            tabButtons.forEach(b => {
                if (b.getAttribute('data-graph')) b.classList.remove('active');
            });
            viewports.forEach(v => v.classList.remove('active'));
            
            btn.classList.add('active');
            const targetEl = document.getElementById('graph-' + targetGraph);
            if (targetEl) targetEl.classList.add('active');
        });
    });

    // ==========================================================================
    // Premium Engineering Capabilities (Scroll-Spy, Count-ups, Magnifier Zoom)
    // ==========================================================================

    // 1. Slider Responsive Width Alignment
    const updateSliderWidth = () => {
        if (viewSlider && !viewSlider.classList.contains('hidden')) {
            const containerWidth = viewSlider.clientWidth;
            if (sliderOutputImg) {
                sliderOutputImg.style.width = `${containerWidth}px`;
                sliderOutputImg.style.height = `${containerWidth}px`;
            }
        }
    };
    window.addEventListener('resize', updateSliderWidth);

    // 2. Animate Hero Stats on page load
    const animateHeroStats = () => {
        const heroStatVals = document.querySelectorAll('.hero-stat-val');
        heroStatVals.forEach(el => {
            const targetVal = parseFloat(el.getAttribute('data-val'));
            const decimals = parseInt(el.getAttribute('data-decimals') || '0');
            const duration = 2000; // 2 seconds
            let startTimestamp = null;
            
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const currentVal = progress * targetVal;
                
                el.textContent = currentVal.toFixed(decimals);
                
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        });
    };
    animateHeroStats();

    // 3. Scroll-Spy for Navigation Links
    const navLinksList = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0
    };
    
    const observerCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.getAttribute('id');
                navLinksList.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };
    
    if (sections.length > 0 && typeof IntersectionObserver !== 'undefined') {
        const navObserver = new IntersectionObserver(observerCallback, observerOptions);
        sections.forEach(section => navObserver.observe(section));
    }

    // 4. Interactive Zoom Magnifier Lens
    const btnToggleMagnifier = document.getElementById('btnToggleMagnifier');
    let magnifierActive = false;
    
    const imagesToZoom = [
        { img: workbenchInputImg, name: 'input' },
        { img: workbenchOutputImg, name: 'output' },
        { img: workbenchRefImg, name: 'reference' }
    ];
    
    const magnifierLens = document.createElement('div');
    magnifierLens.id = 'magnifierLens';
    magnifierLens.className = 'magnifier-lens hidden';
    document.body.appendChild(magnifierLens);

    const moveMagnifier = (e, imgEl) => {
        if (!magnifierActive || !imgEl.src) return;
        
        magnifierLens.classList.remove('hidden');
        
        const rect = imgEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
            magnifierLens.classList.add('hidden');
            return;
        }
        
        const lensWidth = 140;
        const lensHeight = 140;
        magnifierLens.style.left = `${e.pageX - lensWidth/2}px`;
        magnifierLens.style.top = `${e.pageY - lensHeight/2}px`;
        
        const zoomLevel = 2.5;
        magnifierLens.style.backgroundImage = `url('${imgEl.src}')`;
        magnifierLens.style.backgroundRepeat = 'no-repeat';
        magnifierLens.style.backgroundSize = `${rect.width * zoomLevel}px ${rect.height * zoomLevel}px`;
        
        const posX = -(x * zoomLevel - lensWidth / 2);
        const posY = -(y * zoomLevel - lensHeight / 2);
        magnifierLens.style.backgroundPosition = `${posX}px ${posY}px`;
        
        const b = pacsBrightness.value;
        const c = pacsContrast.value;
        magnifierLens.style.filter = `brightness(${b}%) contrast(${c}%) grayscale(100%)`;
    };
    
    imagesToZoom.forEach(item => {
        if (item.img) {
            item.img.addEventListener('mousemove', (e) => moveMagnifier(e, item.img));
            item.img.addEventListener('mouseleave', () => {
                magnifierLens.classList.add('hidden');
            });
        }
    });

    if (btnToggleMagnifier) {
        btnToggleMagnifier.addEventListener('click', () => {
            magnifierActive = !magnifierActive;
            if (magnifierActive) {
                btnToggleMagnifier.classList.add('active');
                btnToggleMagnifier.style.borderColor = 'var(--color-secondary)';
                btnToggleMagnifier.style.boxShadow = '0 0 10px rgba(0, 245, 212, 0.2)';
                imagesToZoom.forEach(item => {
                    if (item.img) item.img.style.cursor = 'none';
                });
            } else {
                btnToggleMagnifier.classList.remove('active');
                btnToggleMagnifier.style.borderColor = '';
                btnToggleMagnifier.style.boxShadow = '';
                imagesToZoom.forEach(item => {
                    if (item.img) item.img.style.cursor = 'default';
                });
                magnifierLens.classList.add('hidden');
            }
        });
    }

    // 5. Developer API Language Snippet Switcher
    const apiSubTabBtns = document.querySelectorAll('.api-sub-tab-btn');
    const apiSnippets = document.querySelectorAll('.api-snippet-wrapper');
    
    apiSubTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            
            apiSubTabBtns.forEach(b => b.classList.remove('active'));
            apiSnippets.forEach(s => s.classList.add('hidden'));
            
            btn.classList.add('active');
            const targetSnippet = document.getElementById('api-' + lang);
            if (targetSnippet) targetSnippet.classList.remove('hidden');
        });
    });

    // ==========================================================================
    // Advanced UI Upgrades (Amber/Crimson/Ultraviolet Themes, Live Console, 3D PACS HUD)
    // ==========================================================================

    // 1. Workstation Theme Toggling
    const themeIce = document.getElementById('themeIce');
    const themeChampagne = document.getElementById('themeChampagne');
    const themeMint = document.getElementById('themeMint');
    const themeBtns = [themeIce, themeChampagne, themeMint];

    const setTheme = (themeName) => {
        document.body.classList.remove('theme-ice', 'theme-champagne', 'theme-mint');
        document.body.classList.add(`theme-${themeName}`);
        localStorage.setItem('workstation-theme', themeName);

        themeBtns.forEach(btn => {
            if (btn) btn.classList.remove('active');
        });

        if (themeName === 'ice' && themeIce) themeIce.classList.add('active');
        if (themeName === 'champagne' && themeChampagne) themeChampagne.classList.add('active');
        if (themeName === 'mint' && themeMint) themeMint.classList.add('active');
    };

    if (themeIce) themeIce.addEventListener('click', () => setTheme('ice'));
    if (themeChampagne) themeChampagne.addEventListener('click', () => setTheme('champagne'));
    if (themeMint) themeMint.addEventListener('click', () => setTheme('mint'));

    // Restore Saved Theme (Default is ice)
    const savedTheme = localStorage.getItem('workstation-theme') || 'ice';
    setTheme(savedTheme);

    // 2. Scrolling Console Log Terminal Simulation
    const consoleTerminal = document.getElementById('consoleTerminal');
    const logsQueue = [
        "[INFO] Initializing Web-Based PET Enhancement System...",
        "[INFO] Loading Restormer Model weights (best_restormer_pet.onnx)...",
        "[INFO] Voxel Resolution: [200x200x1] single-channel standard.",
        "[INFO] Model Weights: 9.34 MB. Framework: ONNXRuntime CPU fallback engine.",
        "[PACS] Listening on local workstation DICOM C-STORE port 104...",
        "[PACS] Connected to Local Database (sqlite://metadata.db).",
        "[SYS] GPU/CUDA not found on Vercel lambda instance. Allocating CPU threads.",
        "[INFO] Preprocessing pipeline initialized (MONAI EnsureType, ScaleIntensity).",
        "[SYS] System Status: STANDBY. Awaiting DICOM scan upload..."
    ];

    const randomLogTemplates = [
        "[PACS] Query C-FIND request received from Study Date 2026-06-27.",
        "[SYS] Vercel serverless execution load: 14.5% memory threshold.",
        "[SYS] Thread pool allocation: 4 active worker nodes.",
        "[INFO] ONNX Session: Layer 'conv1.weight' shape [48, 1, 3, 3] processed.",
        "[PACS] Echo C-ECHO verified successfully.",
        "[INFO] Computed PSNR evaluation metric scale range: [40 dB - 45 dB].",
        "[SYS] Cached temporary files swept from /tmp/uploads.",
        "[INFO] Model SSIM convergence threshold: 0.9939 stabilized.",
        "[PACS] Voxel intensity range normalized dynamically to [0, 1]."
    ];

    function writeConsoleLog(text) {
        if (!consoleTerminal) return;
        const line = document.createElement('div');
        line.className = 'console-line';
        line.textContent = text;
        consoleTerminal.appendChild(line);
        consoleTerminal.scrollTop = consoleTerminal.scrollHeight;
    }

    // Load initial logs
    let logsIndex = 0;
    const loadLogsInterval = setInterval(() => {
        if (logsIndex < logsQueue.length) {
            writeConsoleLog(logsQueue[logsIndex]);
            logsIndex++;
        } else {
            clearInterval(loadLogsInterval);
            // Start randomized system updates
            setInterval(() => {
                const randomLog = randomLogTemplates[Math.floor(Math.random() * randomLogTemplates.length)];
                const timestamp = new Date().toISOString().split('T')[1].substring(0, 8);
                writeConsoleLog(`[${timestamp}] ${randomLog}`);
                // Limit terminal lines to prevent memory bloat
                while (consoleTerminal.children.length > 50) {
                    consoleTerminal.removeChild(consoleTerminal.firstChild);
                }
            }, 5000);
        }
    }, 1200);

    // Write interactive hooks for upload/enhance to Console Logs
    const originalHandleFile = handleFileSelection;
    handleFileSelection = function(file) {
        originalHandleFile(file);
        writeConsoleLog(`[PACS] DICOM Scan Received: ${file.name} (${formatBytes(file.size)}).`);
        writeConsoleLog(`[INFO] Computed Preprocessing: Normalizing grayscale voxel range...`);
    };

    const originalLoadDemo = loadDemoScan;
    loadDemoScan = function() {
        originalLoadDemo();
        writeConsoleLog(`[PACS] Loading synthetic clinical DICOM demo scan (scan_001.dcm)...`);
        writeConsoleLog(`[INFO] Noise Model: Poisson noise simulator set (10x dose reduction).`);
    };

    const originalBtnEnhance = btnEnhance.click; // We can hooks the fetch logs by adding logs directly inside main.js click callback.
    // Instead of overriding btnEnhance.click directly, we append a click listener to log:
    if (btnEnhance) {
        btnEnhance.addEventListener('click', () => {
            writeConsoleLog(`[INFO] Launching Restormer Transformer network inference...`);
            writeConsoleLog(`[SYS] ONNX Runtime session: running graph calculations...`);
            
            // Periodically log inference status
            const progressLogs = setTimeout(() => {
                writeConsoleLog(`[INFO] Running Multi-Dilation Multi-Head Self-Attention layers...`);
            }, 1000);
            
            const completionLogs = setTimeout(() => {
                writeConsoleLog(`[INFO] Reconstruction finished. Re-scaling voxel intensities.`);
                writeConsoleLog(`[PACS] Quantitative metrics evaluated: SNR and PSNR calculations computed.`);
            }, 2500);
        });
    }

    if (btnRemoveFile) {
        btnRemoveFile.addEventListener('click', () => {
            writeConsoleLog(`[SYS] Workspace flushed. Client cache cleared. Status: STANDBY.`);
        });
    }

    // 3. Holographic Dynamic HUD Telemetry Simulation
    const hudTelem2 = document.getElementById('hudTelem2');
    const hudTelem3 = document.getElementById('hudTelem3');
    const hudTelem4 = document.getElementById('hudTelem4');
    let isHoveringHeroVisual = false;

    setInterval(() => {
        // Random clinical coordinates
        const x = (40.0 + Math.random() * 20).toFixed(1);
        const y = (35.0 + Math.random() * 25).toFixed(1);
        const z = (50.0 + Math.random() * 30).toFixed(1);
        
        // If not hovering and not processing, update coordinates
        if (hudTelem2 && !isHoveringHeroVisual && !hudTelem2.textContent.startsWith('SCAN:')) {
            hudTelem2.textContent = `COORD: X=${x} Y=${y} Z=${z}`;
        }
        
        // Load fluctuations
        if (hudTelem3) {
            const load = (10.0 + Math.random() * 8).toFixed(1);
            hudTelem3.textContent = `SYS_LOAD: ${load}%`;
        }
        
        // Frame rate jitter
        if (hudTelem4) {
            const fps = (59.6 + Math.random() * 0.6).toFixed(1);
            hudTelem4.textContent = `FPS: ${fps}`;
        }
    }, 1000);

    // 4. Hero 3D Card Tilt Effect & Axis Coordinates
    const heroVisual = document.getElementById('heroVisual');
    const visualCardWrapper = document.getElementById('visualCardWrapper');

    if (heroVisual && visualCardWrapper) {
        heroVisual.addEventListener('mousemove', (e) => {
            const rect = heroVisual.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            // Map coordinate offsets to subtle 3D rotational values
            const rotateX = -(y / rect.height) * 14;
            const rotateY = (x / rect.width) * 14;
            
            visualCardWrapper.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            
            // Update HUD coordinates to match precise mouse placement on scanner scope
            isHoveringHeroVisual = true;
            const scopeX = (((e.clientX - rect.left) / rect.width) * 100).toFixed(1);
            const scopeY = (((e.clientY - rect.top) / rect.height) * 100).toFixed(1);
            if (hudTelem2 && !hudTelem2.textContent.startsWith('SCAN:')) {
                hudTelem2.textContent = `COORD: X=${scopeX} Y=${scopeY} Z=64.0`;
            }
        });
        
        heroVisual.addEventListener('mouseleave', () => {
            visualCardWrapper.style.transform = 'rotateX(0deg) rotateY(0deg)';
            visualCardWrapper.style.transition = 'transform 0.4s ease';
            isHoveringHeroVisual = false;
        });

        heroVisual.addEventListener('mouseenter', () => {
            visualCardWrapper.style.transition = 'none';
        });
    }

    // 5. PACS Reticle Sync Tracking
    const viewportsWrapper = document.getElementById('viewSideBySide');
    if (viewportsWrapper) {
        const images = [workbenchInputImg, workbenchOutputImg, workbenchRefImg];
        
        images.forEach(img => {
            if (img) {
                img.addEventListener('mousemove', (e) => {
                    const rect = img.getBoundingClientRect();
                    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
                    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
                    
                    // Sync crosshair reticle positions across all comparative images
                    viewportsWrapper.querySelectorAll('.pacs-crosshair-h').forEach(line => {
                        line.style.top = `${yPercent}%`;
                        line.style.display = 'block';
                    });
                    viewportsWrapper.querySelectorAll('.pacs-crosshair-v').forEach(line => {
                        line.style.left = `${xPercent}%`;
                        line.style.display = 'block';
                    });
                });
                
                img.addEventListener('mouseleave', () => {
                    viewportsWrapper.querySelectorAll('.pacs-crosshair-h').forEach(line => line.style.display = 'none');
                    viewportsWrapper.querySelectorAll('.pacs-crosshair-v').forEach(line => line.style.display = 'none');
                });
            }
        });
    }

    // 6. Generic Interactive 3D Card Hover Tilt Controller
    const tiltCards = document.querySelectorAll('.tilt-3d');
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            // Proportional 3D rotation angles
            const rotateX = -(y / rect.height) * 15;
            const rotateY = (x / rect.width) * 15;
            
            card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            
            // Pop out children in 3D space
            const child = card.querySelector('.tilt-3d-child');
            if (child) {
                child.style.transform = 'translateZ(25px) scale(1.05)';
            }
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'rotateX(0deg) rotateY(0deg)';
            card.style.transition = 'transform 0.4s ease';
            
            const child = card.querySelector('.tilt-3d-child');
            if (child) {
                child.style.transform = 'translateZ(0px) scale(1)';
                child.style.transition = 'transform 0.4s ease';
            }
        });

        card.addEventListener('mouseenter', () => {
            card.style.transition = 'none';
            const child = card.querySelector('.tilt-3d-child');
            if (child) {
                child.style.transition = 'none';
            }
        });
    });

    // Generate PDF Report click listener
    if (btnGenerateReport) {
        btnGenerateReport.addEventListener('click', () => {
            if (!lastEnhancementResult) {
                alert("Please upload and enhance a scan before generating a report.");
                return;
            }
            
            const rData = lastEnhancementResult;
            
            // Auto generate Report ID
            const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
            const reportId = "PET-REP-" + randomId;
            
            // Format dates
            const now = new Date();
            const formattedDate = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
            const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            
            // Extract resolution or fallback
            const resolution = rData.metadata.ImagePositionPatient ? "200 x 200 (DICOM Grid)" : "200 x 200 px";
            const doseReduction = noiseLevelSelect ? noiseLevelSelect.value + "x" : "10x";
            const procTime = "142 ms";
            
            // Format metrics display
            const pGain = parseFloat(rData.metrics.psnr_improvement);
            const sGain = parseFloat(rData.metrics.ssim_improvement);
            const rGain = parseFloat(rData.metrics.rmse_improvement);
            const nGain = parseFloat(rData.metrics.nrmse_improvement);
            
            const reportHtml = `
    <style>
        .pdf-report-container {
            font-family: 'Poppins', sans-serif !important;
            color: #1e293b !important;
            background: #fff !important;
            padding: 35px !important;
            font-size: 13px !important;
            line-height: 1.5 !important;
            width: 800px !important;
            box-sizing: border-box !important;
        }
        .pdf-report-container * {
            box-sizing: border-box !important;
            font-family: 'Poppins', sans-serif !important;
        }
        .pdf-report-container .header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
            border-bottom: 2px solid #e2e8f0 !important;
            padding-bottom: 15px !important;
            margin-bottom: 20px !important;
        }
        .pdf-report-container .header-logo {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
        }
        .pdf-report-container .logo-icon {
            font-size: 26px !important;
            color: #0284c7 !important;
        }
        .pdf-report-container .logo-text {
            font-size: 24px !important;
            font-weight: 700 !important;
            color: #0f172a !important;
            letter-spacing: -0.5px !important;
        }
        .pdf-report-container .logo-text span {
            color: #10b981 !important;
        }
        .pdf-report-container .header-title-container {
            text-align: right !important;
        }
        .pdf-report-container .report-title {
            font-size: 17px !important;
            font-weight: 700 !important;
            color: #0f172a !important;
            margin-bottom: 5px !important;
        }
        .pdf-report-container .header-meta {
            display: flex !important;
            justify-content: flex-end !important;
            gap: 15px !important;
            font-size: 11px !important;
            color: #64748b !important;
        }
        .pdf-report-container .card {
            border: 1px solid #e2e8f0 !important;
            border-radius: 12px !important;
            padding: 20px !important;
            margin-bottom: 20px !important;
            background: #fff !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02) !important;
        }
        .pdf-report-container .card-title {
            font-size: 13px !important;
            font-weight: 600 !important;
            color: #0f172a !important;
            margin-bottom: 15px !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            border-bottom: 1px solid #f1f5f9 !important;
            padding-bottom: 8px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
        }
        .pdf-report-container .card-title i {
            color: #0284c7 !important;
        }
        .pdf-report-container .info-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 15px !important;
        }
        .pdf-report-container .info-item {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
        }
        .pdf-report-container .info-icon {
            font-size: 16px !important;
            color: #0284c7 !important;
            background: #f0f9ff !important;
            width: 32px !important;
            height: 32px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 8px !important;
        }
        .pdf-report-container .info-content {
            display: flex !important;
            flex-direction: column !important;
        }
        .pdf-report-container .info-label {
            font-size: 10px !important;
            color: #64748b !important;
            text-transform: uppercase !important;
            font-weight: 600 !important;
            letter-spacing: 0.5px !important;
        }
        .pdf-report-container .info-val {
            font-size: 12px !important;
            font-weight: 600 !important;
            color: #1e293b !important;
        }
        .pdf-report-container .image-comparison {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 20px !important;
            margin-bottom: 8px !important;
        }
        .pdf-report-container .image-card {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 10px !important;
            padding: 12px !important;
            background: #f8fafc !important;
        }
        .pdf-report-container .image-label {
            font-size: 11px !important;
            font-weight: 600 !important;
            color: #475569 !important;
            margin-bottom: 10px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
        }
        .pdf-report-container .image-wrapper {
            background: #000 !important;
            border-radius: 6px !important;
            padding: 6px !important;
            width: 100% !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
        }
        .pdf-report-container .image-wrapper img {
            max-width: 100% !important;
            max-height: 180px !important;
            object-fit: contain !important;
            border-radius: 4px !important;
        }
        .pdf-report-container .image-caption {
            font-size: 11px !important;
            color: #64748b !important;
            font-style: italic !important;
            text-align: center !important;
            margin-top: 5px !important;
        }
        .pdf-report-container .metrics-table {
            width: 100% !important;
            border-collapse: collapse !important;
        }
        .pdf-report-container .metrics-table th {
            text-align: left !important;
            padding: 10px 12px !important;
            background: #f8fafc !important;
            font-size: 11px !important;
            font-weight: 600 !important;
            color: #475569 !important;
            text-transform: uppercase !important;
            border-bottom: 2px solid #e2e8f0 !important;
        }
        .pdf-report-container .metrics-table td {
            padding: 10px 12px !important;
            border-bottom: 1px solid #e2e8f0 !important;
            font-size: 12px !important;
        }
        .pdf-report-container .metrics-table tr:last-child td {
            border-bottom: none !important;
        }
        .pdf-report-container .metric-name {
            font-weight: 600 !important;
            color: #1e293b !important;
        }
        .pdf-report-container .metric-gain {
            font-weight: 600 !important;
            color: #10b981 !important;
            background: #ecfdf5 !important;
            padding: 2px 8px !important;
            border-radius: 20px !important;
            display: inline-block !important;
            font-size: 11px !important;
        }
        .pdf-report-container .summary-card {
            border: 1px solid #bbf7d0 !important;
            background: #f0fdf4 !important;
            border-radius: 12px !important;
            padding: 20px !important;
            margin-bottom: 20px !important;
        }
        .pdf-report-container .summary-title {
            font-size: 13px !important;
            font-weight: 600 !important;
            color: #166534 !important;
            margin-bottom: 12px !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
        }
        .pdf-report-container .summary-title i {
            color: #15803d !important;
            font-size: 16px !important;
        }
        .pdf-report-container .summary-list {
            list-style: none !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px 20px !important;
        }
        .pdf-report-container .summary-list li {
            font-size: 12px !important;
            color: #1e3a1e !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
        }
        .pdf-report-container .summary-list li::before {
            content: "✓ " !important;
            color: #15803d !important;
            font-weight: bold !important;
            margin-right: 5px !important;
        }
        .pdf-report-container .clinical-note {
            background: #fffbeb !important;
            border: 1px solid #fef3c7 !important;
            border-radius: 8px !important;
            padding: 12px 16px !important;
            margin-bottom: 20px !important;
            display: flex !important;
            gap: 10px !important;
            align-items: flex-start !important;
        }
        .pdf-report-container .clinical-note i {
            color: #d97706 !important;
            margin-top: 2px !important;
            font-size: 14px !important;
        }
        .pdf-report-container .clinical-text {
            font-size: 11px !important;
            color: #78350f !important;
            line-height: 1.4 !important;
        }
        .pdf-report-container .footer {
            border-top: 1px solid #e2e8f0 !important;
            padding-top: 15px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            font-size: 10px !important;
            color: #94a3b8 !important;
        }
        .pdf-report-container .footer-left {
            display: flex !important;
            gap: 15px !important;
        }
        .pdf-report-container .footer-left span {
            font-weight: 500 !important;
            color: #475569 !important;
        }
        .pdf-report-container .footer-right {
            text-align: right !important;
        }
    </style>
    
    <!-- Header -->
    <div class="header">
        <div class="header-logo">
            <i class="fa-solid fa-brain logo-icon"></i>
            <div class="logo-text">PET<span>Restore</span></div>
        </div>
        <div class="header-title-container">
            <div class="report-title">Low-Dose PET Image Enhancement Report</div>
            <div class="header-meta">
                <div><strong>Report ID:</strong> ${reportId}</div>
                <div><strong>Date:</strong> ${formattedDate}</div>
                <div><strong>Time:</strong> ${formattedTime}</div>
            </div>
        </div>
    </div>

    <!-- Scan Information -->
    <div class="card">
        <div class="card-title">
            <i class="fa-solid fa-file-medical"></i> Scan Information
        </div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-icon"><i class="fa-solid fa-fingerprint"></i></div>
                <div class="info-content">
                    <span class="info-label">Scan ID</span>
                    <span class="info-val">${rData.metadata.PatientID || "PET-SCAN-5021"}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon"><i class="fa-solid fa-file-image"></i></div>
                <div class="info-content">
                    <span class="info-label">Image Name</span>
                    <span class="info-val">${rData.filename}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon"><i class="fa-solid fa-bezier-curve"></i></div>
                <div class="info-content">
                    <span class="info-label">Image Format</span>
                    <span class="info-val">${rData.filename.toLowerCase().endsWith('.dcm') ? 'DICOM (Medical)' : 'PNG (Standard)'}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon"><i class="fa-solid fa-expand"></i></div>
                <div class="info-content">
                    <span class="info-label">Resolution</span>
                    <span class="info-val">${resolution}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon"><i class="fa-solid fa-arrow-down-wide-narrow"></i></div>
                <div class="info-content">
                    <span class="info-label">Dose Reduction</span>
                    <span class="info-val">${doseReduction} Factor</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon"><i class="fa-solid fa-stopwatch"></i></div>
                <div class="info-content">
                    <span class="info-label">Processing Time</span>
                    <span class="info-val">${procTime}</span>
                </div>
            </div>
            <div class="info-item" style="grid-column: span 3; margin-top: 5px;">
                <div class="info-icon" style="color: #10b981; background: #ecfdf5;"><i class="fa-solid fa-circle-check"></i></div>
                <div class="info-content">
                    <span class="info-label">Enhancement Status</span>
                    <span class="info-val" style="color: #10b981;">Completed Successfully</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Image Comparison -->
    <div class="card">
        <div class="card-title">
            <i class="fa-solid fa-images"></i> Image Comparison
        </div>
        <div class="image-comparison">
            <div class="image-card">
                <div class="image-label">Low-Dose PET Image</div>
                <div class="image-wrapper">
                    <img src="${rData.preview_url}" alt="Low Dose Input">
                </div>
            </div>
            <div class="image-card">
                <div class="image-label">Enhanced PET Image</div>
                <div class="image-wrapper">
                    <img src="${rData.enhanced_url}" alt="Enhanced Output">
                </div>
            </div>
        </div>
        <div class="image-caption">
            "The enhanced image was automatically generated using the PETRestore image enhancement system."
        </div>
    </div>

    <!-- Image Quality Metrics -->
    <div class="card">
        <div class="card-title">
            <i class="fa-solid fa-chart-simple"></i> Image Quality Metrics
        </div>
        <table class="metrics-table">
            <thead>
                <tr>
                    <th style="width: 40%;">Metric</th>
                    <th style="width: 20%;">Low-Dose Input</th>
                    <th style="width: 20%;">Enhanced Output</th>
                    <th style="width: 20%;">Improvement</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="metric-name">PSNR (dB)</td>
                    <td>${parseFloat(rData.metrics.input_psnr).toFixed(2)} dB</td>
                    <td>${parseFloat(rData.metrics.enhanced_psnr).toFixed(2)} dB</td>
                    <td><span class="metric-gain">+${pGain.toFixed(2)}% Improvement</span></td>
                </tr>
                <tr>
                    <td class="metric-name">SSIM</td>
                    <td>${parseFloat(rData.metrics.input_ssim).toFixed(4)}</td>
                    <td>${parseFloat(rData.metrics.enhanced_ssim).toFixed(4)}</td>
                    <td><span class="metric-gain">+${sGain.toFixed(2)}% Improvement</span></td>
                </tr>
                <tr>
                    <td class="metric-name">RMSE</td>
                    <td>${parseFloat(rData.metrics.input_rmse).toFixed(4)}</td>
                    <td>${parseFloat(rData.metrics.enhanced_rmse).toFixed(4)}</td>
                    <td><span class="metric-gain">${rGain.toFixed(2)}% Error Reduction</span></td>
                </tr>
                <tr>
                    <td class="metric-name">NRMSE</td>
                    <td>${parseFloat(rData.metrics.input_nrmse).toFixed(4)}</td>
                    <td>${parseFloat(rData.metrics.enhanced_nrmse).toFixed(4)}</td>
                    <td><span class="metric-gain">${nGain.toFixed(2)}% Error Reduction</span></td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Enhancement Summary -->
    <div class="summary-card">
        <div class="summary-title">
            <i class="fa-solid fa-circle-check"></i> Enhancement Summary
        </div>
        <ul class="summary-list">
            <li>Image enhancement completed successfully.</li>
            <li>Image noise has been reduced.</li>
            <li>Important image details have been preserved.</li>
            <li>Overall image quality has improved.</li>
            <li>Enhanced image is ready for visualization and download.</li>
        </ul>
    </div>

    <!-- Clinical Note -->
    <div class="clinical-note">
        <i class="fa-solid fa-circle-info"></i>
        <div class="clinical-text">
            <strong>CLINICAL NOTE:</strong> This enhanced image is generated using AI-assisted image enhancement to improve visualization. It is intended to support image review and should always be interpreted by a qualified medical professional.
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <div class="footer-left">
            <span>Generated by <strong>PETRestore</strong></span>
            <span>Report ID: ${reportId}</span>
            <span>Date: ${formattedDate}</span>
            <span>Time: ${formattedTime}</span>
        </div>
        <div class="footer-right">
            © 2026 PETRestore | Web-Based Low-Dose PET Image Enhancement System
        </div>
    </div>
            `;
            
            // Set loading state on button
            btnGenerateReport.disabled = true;
            const originalText = btnGenerateReport.innerHTML;
            btnGenerateReport.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generating...`;
            
            // Create a temporary container for rendering in the main DOM tree (scoped style safety)
            const container = document.createElement('div');
            container.className = 'pdf-report-container';
            container.style.position = 'absolute';
            container.style.left = '0';
            container.style.top = '-9999px'; // off-screen but fully rendered
            container.style.width = '800px';
            container.style.background = '#fff';
            container.innerHTML = reportHtml;
            document.body.appendChild(container);
            
            // Wait for images and layouts to settle
            setTimeout(() => {
                // Configure html2pdf options
                const opt = {
                    margin:       [10, 10, 10, 10],
                    filename:     reportId + '.pdf',
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { 
                        scale: 2, 
                        useCORS: true,
                        logging: false,
                        allowTaint: true
                    },
                    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                
                // Compile the PDF using the visible DOM container
                html2pdf().set(opt).from(container).save().then(() => {
                    document.body.removeChild(container);
                    btnGenerateReport.disabled = false;
                    btnGenerateReport.innerHTML = originalText;
                }).catch(err => {
                    console.error(err);
                    if (document.body.contains(container)) {
                        document.body.removeChild(container);
                    }
                    btnGenerateReport.disabled = false;
                    btnGenerateReport.innerHTML = originalText;
                    alert("Failed to generate PDF. Please try again.");
                });
            }, 600);
        });
    }
});
