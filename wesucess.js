if (window.top === window) {
    let isRunning = sessionStorage.getItem('cczu_bot_running') === 'true';
    // 创建UI
    const style = document.createElement('style');
    style.innerHTML = `
            #global-ui-panel {
                position: fixed; top: 20px; right: 20px; z-index: 2147483647; 
                width: 250px; height: 260px;
                display: flex; flex-direction: column;
                
                /* 🎨 底色与液态玻璃模糊 */
                background-color: rgba(40, 40, 40, 0.4);           
                backdrop-filter: blur(20px) saturate(180%);     
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                
                /* 🖼️ 壁纸预留位：在 url('') 里面填入图片链接即可 */
                background-image: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(''));
                background-size: cover; 
                background-position: center;

                color: #fff; padding: 15px; border-radius: 20px;                            
                font-family: 'Consolas', monospace; font-size: 12px; box-sizing: border-box;
                border: 1px solid rgba(103, 232, 249, 0.3);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255,255,255,0.2);
                overflow: hidden; user-select: none;
            }
            #ui-header {
                border-bottom: 1px solid rgba(103, 232, 249, 0.3); 
                padding-bottom: 6px; margin-bottom: 10px; font-weight: bold; 
                color: #67e8f9; text-align: center; cursor: move; flex-shrink: 0;
            }
            #ui-controls {
                display: flex; gap: 10px; margin-bottom: 10px; flex-shrink: 0;
            }
            .ctrl-btn {
                flex: 1; padding: 6px 0; border-radius: 8px; border: 1px solid rgba(255,255,255,0.3);
                background: rgba(0,0,0,0.3); color: #fff; font-weight: bold; cursor: pointer;
                transition: all 0.2s;
            }
            .ctrl-btn:hover { background: rgba(255,255,255,0.2); }
            .btn-active { 
                background: rgba(103, 232, 249, 0.4); border-color: #67e8f9; 
                color: #fff; box-shadow: 0 0 10px rgba(103, 232, 249, 0.4); 
            }
            #ui-log-container {
                flex-grow: 1; overflow-y: auto; line-height: 1.6; scrollbar-width: none;
            }
            #ui-log-container::-webkit-scrollbar { display: none; }
        `;
    document.head.appendChild(style);

    // 插入UI结构
    const panel = document.createElement('div');
    panel.id = 'global-ui-panel';
    panel.innerHTML = `
            <div id="ui-header">🛰️ youLearn v1.0</div>
            <div id="ui-controls">
                <button id="btn-start" class="ctrl-btn ${isRunning ? 'btn-active' : ''}">▶ 开始</button>
                <button id="btn-stop" class="ctrl-btn ${!isRunning ? 'btn-active' : ''}">⏸ 暂停</button>
            </div>
            <div id="ui-log-container">${isRunning ? '系统运行中...' : '系统已暂停，等待...'}</div>
        `;
    document.body.appendChild(panel);

    // 拖动功能 
    let isDragging = false, offsetX, offsetY;
    const header = document.getElementById('ui-header');
    header.onmousedown = (e) => {
        isDragging = true;
        offsetX = e.clientX - panel.getBoundingClientRect().left;
        offsetY = e.clientY - panel.getBoundingClientRect().top;
        panel.style.transition = 'none';
    };
    document.onmousemove = (e) => {
        if (!isDragging) return;
        panel.style.left = Math.max(0, Math.min(e.clientX - offsetX, window.innerWidth - 250)) + 'px';
        panel.style.top = Math.max(0, Math.min(e.clientY - offsetY, window.innerHeight - 260)) + 'px';
        panel.style.right = 'auto';
    };
    document.onmouseup = () => isDragging = false;

    // UI实时响应日志
    const logToUI = (msg, color = '#fff') => {
        const container = document.getElementById('ui-log-container');
        if (container) {
            if (container.innerHTML.includes('等待指令')) container.innerHTML = '';
            container.innerHTML += `<div style="color: ${color}; margin-bottom: 3px;">> ${msg}</div>`;
            container.scrollTop = container.scrollHeight;
        }
    };

    // 开始结束按钮（只能控制章节之间，无法及时停止）
    const btnStart = document.getElementById('btn-start');
    const btnStop = document.getElementById('btn-stop');

    const broadcastState = (state) => {
        document.querySelectorAll('iframe').forEach(f => {
            if (f.contentWindow) f.contentWindow.postMessage({ type: 'sys_control', running: state }, '*');
        });
    };

    btnStart.onclick = () => {
        if (isRunning) return;
        isRunning = true;
        sessionStorage.setItem('cczu_bot_running', 'true');
        btnStart.classList.add('btn-active'); btnStop.classList.remove('btn-active');
        logToUI('▶ 引擎点火，开始刷课', '#00ff00');
        broadcastState(true);
    };

    btnStop.onclick = () => {
        if (!isRunning) return;
        isRunning = false;
        sessionStorage.setItem('cczu_bot_running', 'false');
        btnStop.classList.add('btn-active'); btnStart.classList.remove('btn-active');
        logToUI('⏸ 引擎切断，系统挂机', '#ffaa00');
        broadcastState(false);
    };

    // 监听iframe
    window.addEventListener('message', async (event) => {
        const data = event.data;
        if (!data) return;

        // 响应Iframe
        if (data.type === 'query_state') {
            event.source.postMessage({ type: 'sys_control', running: isRunning }, '*');
        }

        // 接收Iframe
        if (data.type === 'log') {
            logToUI(data.content, data.color);
        }

        // 接收翻页请求
        if (data === 'next_page' || data.type === 'nav') {
            logToUI('正在执行翻页操作...', '#ffff00');
            await new Promise(r => setTimeout(r, 1000));

            let next_li = document.querySelector('li.c_s_3_2')?.children[0];
            if (next_li) {
                next_li.click();
                logToUI('翻页成功，即将物理重置', '#00ff00');
                setTimeout(() => location.reload(), 2000);
            } else {
                logToUI('❌ 未找到翻页按钮', '#ff0000');
            }
        }
    });
}

// 刷题
if (window.location.href.includes('center')) {
    let isWorkingAllowed = false;

    // 监听最
    window.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'sys_control') {
            isWorkingAllowed = e.data.running;
        }
    });
    // 刷新，问题型
    window.parent.postMessage({ type: 'query_state' }, '*');

    // 发送日志的封装函数
    const reportLog = (content, color = '#fff') => {
        window.parent.postMessage({ type: 'log', content, color }, '*');
    };

    let checkExist = setInterval(async function () {
        // 开机
        if (!isWorkingAllowed) return;

        let opt_li = document.querySelectorAll('ol li');
        let tf_span_parents = document.querySelectorAll('span[class="controls"]');
        let fill = document.querySelectorAll('span[class="key"]');

        if (opt_li.length > 0 || tf_span_parents.length > 0 || fill.length > 0) {

            // 自己筛选学校要求
            const homework = ['15', '16', '17'];
            let titleNode = document.querySelector('span.parent');
            let title = titleNode ? titleNode.textContent : 'Unknown';

            if (!homework.some(num => title.includes(num))) {
                reportLog(`⏭️ 跳过非作业章节: ${title}`, '#ffa500');
                clearInterval(checkExist);
                window.parent.postMessage('next_page', '*');
                return;
            }
            reportLog(`🎯 锁定目标: ${title}`, '#00ff00');
            clearInterval(checkExist); 
            if (opt_li.length > 0) {
                reportLog('开始破解选择题...', '#fff');
                await solve_opt(opt_li, reportLog);
            }
            if (tf_span_parents.length > 0) {
                reportLog('开始破解判断题...', '#fff');
                await solve_judge(tf_span_parents, reportLog);
            }
            if (fill.length > 0) {
                reportLog('开始破解填空题...', '#fff');
                await solve_fill(fill, reportLog);
            }
            // 翻页
            const submit_span = Array.from(document.querySelectorAll('span')).find(s => s.textContent == 'Submit');
            if (submit_span) {
                submit_span.click();
                await new Promise(r => setTimeout(r, 800));
                let confirm_bnt = document.querySelector('span.ng-confirm-btn-text');
                if (confirm_bnt) confirm_bnt.click();
                reportLog('✅ 作业已提交', '#00ff00');
            }
            window.parent.postMessage('next_page', '*');
        }
    }, 500);
}
// 做题函数
async function solve_fill(fill, reportLog) {
    for (let j = 0; j < fill.length; j++) {
        let avalue = fill[j].textContent;
        let parent = fill[j].parentElement;
        let input = Array.from(parent.children).find(c => c != fill[j] && c.tagName == 'SPAN');
        if (input) {
            input.focus();
            input.textContent = avalue;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));
            await new Promise(r => setTimeout(r, 500));
            reportLog(`填空[${j + 1}/${fill.length}] 注入成功`, '#a5b4fc');
        }
    }
}

async function solve_judge(tf_span_parents, reportLog) {
    for (let j = 0; j < tf_span_parents.length; j++) {
        for (let i = 0; i < 2; i++) {
            tf_span_parents[j].children[i].click();
            await new Promise(r => setTimeout(r, 500));
            let check = tf_span_parents[j].closest('div');
            if (check?.getAttribute('class').includes('correct')) {
                reportLog(`判断[${j + 1}/${tf_span_parents.length}] 破解成功`, '#a5b4fc');
                break;
            }
        }
    }
}

async function solve_opt(opt_li, reportLog) {
    let num = opt_li.length / 4;
    for (let j = 0; j < num; j++) {
        for (let i = j * 4; i < (j + 1) * 4; i++) {
            opt_li[i].click();
            await new Promise(r => setTimeout(r, 500));
            let check = opt_li[i].closest('div');
            if (check?.getAttribute('class').includes('correct')) {
                reportLog(`选择[${j + 1}/${num}] 破解成功`, '#a5b4fc');
                break;
            }
        }
        await new Promise(r => setTimeout(r, 300));
    }
}
