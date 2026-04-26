// 判断是否在iframe内
if (window.location.href.includes('center')) {
    console.log('成功进入iframe');
    // 添加正确答案的标准(已经修改了，这个思路放这里给想修改的大家提供一个思路)
    const ans1 = 'wrapper correct';
    const ans2 = 'wrapper isKeyVisible correct';
    // 设定一个定时器，每500ms去页面里找一次选项（待尝试是否有必要,因为第一遍就写了，懒得再测试了）
    let checkExist = setInterval(async function () {
        let opt_li = document.querySelectorAll('ol li');
        // 判断题比较特殊，需要父元素定位子元素
        let tf_span_parents = document.querySelectorAll('span[class="controls"]');
        // 填空题答案
        let fill = document.querySelectorAll('span[class="key"]');
        if (opt_li.length > 0 || tf_span_parents.length > 0 || fill.length > 0) {
            console.log('网页加载完毕');
            const homework = ['15','16','17'];
            let title = document.querySelector('span.parent').textContent;
            let flag = homework.some(num => title.includes(num));
            if (!flag) {
                console.log('这不是CCZU的作业，即将跳过');
                clearInterval(checkExist);
                window.parent.postMessage('next_page','*');
                return;
            }
            // 刚开始忘写这个那数据包给我笑死了
            clearInterval(checkExist);
            if (opt_li.length > 0) {
                console.log('成功获取选择题选项，开始做选择题');
                await solve_opt(opt_li);
            }
            if (tf_span_parents.length > 0) {
                console.log('成功获取判断题选项，开始做判断题');
                await solve_judge(tf_span_parents);
            }
            if (fill.length > 0) {
                console.log('成功获取填空题选项，开始做填空题');
                await solve_fill(fill);
            }
            // window.parent.postMessage({ action: 'mission_accomplished' }, '*');
            // 把按钮都弄过来
            // 定位提交按钮
            const submit_span = Array.from(document.querySelectorAll('span')).find(
            span => span.textContent == 'Submit');
            submit_span.click();
            await new Promise(resolve => setTimeout(resolve, 500));
            // 定位确认提交按钮
            let confirm_bnt = document.querySelector('span.ng-confirm-btn-text');
            await new Promise(resolve => setTimeout(resolve, 500));
            confirm_bnt.click();
            // 完成任务后发送消息给主页面，准备翻页
            window.parent.postMessage('next_page', '*');
        } else {
            console.log('网页正在加载中...');
        }
    }, 500);
    console.log('提交完成');
}

// 主页面翻页
if (window.top == window) {
    console.log('正在等待翻页请求');
    window.addEventListener('message', async (event) => {
        if (event.data == 'next_page') {
            console.log('收到翻页请求，正在准备翻页');
            await new Promise(resolve => setTimeout(resolve, 1000));
            let next_li = document.querySelector('li.c_s_3_2').children[0];
            next_li.click();
            console.log('翻页成功');
            location.reload();
        }
    });
}

// 填空题
async function solve_fill(fill) {
    let ques_num3 = fill.length;
    for (let j = 0; j < ques_num3; j++) {
        let avalue = fill[j].textContent;
        let parent = fill[j].parentElement;
        let fill_input = Array.from(parent.children).find(child => child != fill[j] && child.tagName=='SPAN');
        fill_input.focus();
        fill_input.textContent = avalue;
        // ng框架需要绑定，用这个冒泡dispatch测试一下(成功了)
        fill_input.dispatchEvent(new Event('input', { bubbles: true }));
        fill_input.dispatchEvent(new Event('change', { bubbles: true }));
        fill_input.dispatchEvent(new Event('blur', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`第${j + 1}题完成`);
    }
    console.log('填空题全部完成');
}
// 判断题
async function solve_judge(tf_span_parents) {
    let ques_num2 = tf_span_parents.length;
    for (let j = 0; j < ques_num2; j++) {
        for (let i = 0; i < 2; i++) {
            tf_span_parents[j].children[i].click();
            //和选择题一样的等待
            await new Promise(resolve => setTimeout(resolve, 500));
            let check_ddiv = tf_span_parents[j].closest('div');
            let check_aans = check_ddiv.getAttribute('class');
            if (check_aans.includes('correct')) {
                console.log(`第${j + 1}题完成`);
                break;
            } else {
                console.log(`尝试中...`);
            }
        }
    }
}
// 选择题
async function solve_opt(opt_li) {
    let ques_num1 = opt_li.length / 4;
    for (let j = 0; j < ques_num1; j++) {
        for (let i = j * 4; i < (j + 1) * 4; i++) {
            opt_li[i].click();
            //强制网页等待，给js判断事件（写到这里忽然怀念py）
            await new Promise(resolve => setTimeout(resolve, 500));
            let check_div = opt_li[i].closest('div');
            let check_ans = check_div.getAttribute('class');
            if (check_ans.includes('correct')) {
                console.log(`第${j + 1}题完成`);
                break; // 这题选对了，跳出选项循环，做下一题
            } else {
                console.log(`尝试中...`);
            }
        }
        // 题目之间稍微停顿，防止被检测（虽然我没看src不知道会不会有检测）
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    console.log('选择题全部完成');
}

