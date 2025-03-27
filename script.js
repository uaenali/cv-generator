document.addEventListener('DOMContentLoaded', function () {
  const fileInput = document.getElementById('fileInput');
  const editor = document.getElementById('editor');
  const preview = document.getElementById('preview');
  const exportDocBtn = document.getElementById('exportDoc');
  const exportPdfBtn = document.getElementById('exportPdf');

  // 配置marked选项
  marked.setOptions({
    highlight: function (code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true,
  });

  // 设置编辑器为可编辑
  editor.contentEditable = true;

  // 添加示例模板
  const template = `<h1 class="resume-title">个人简历</h1>

<h2 class="section-title">
  <i class="fas fa-user"></i>基本信息
</h2>
<div class="basic-info">
  <div class="basic-info-item">
    <i class="fas fa-user"></i>
    <span>姓名：张三</span>
  </div>
  <div class="basic-info-item">
    <i class="fas fa-birthday-cake"></i>
    <span>年龄：25</span>
  </div>
  <div class="basic-info-item">
    <i class="fas fa-envelope"></i>
    <span>邮箱：example@email.com</span>
  </div>
  <div class="basic-info-item">
    <i class="fas fa-phone"></i>
    <span>电话：123-4567-8900</span>
  </div>
  <div class="basic-info-item">
    <i class="fas fa-map-marker-alt"></i>
    <span>地址：北京市朝阳区</span>
  </div>
</div>

<h2 class="section-title">
  <i class="fas fa-graduation-cap"></i>教育背景
</h2>
<div class="item-header">
  <span class="item-title">某某大学</span>
  <span class="item-date">2018-2022</span>
</div>
<div class="item-content">
  <ul>
    <li>专业：计算机科学与技术</li>
    <li>学位：学士</li>
    <li>GPA：3.8/4.0</li>
  </ul>
</div>

<h2 class="section-title">
  <i class="fas fa-briefcase"></i>工作经验
</h2>
<div class="item-header">
  <span class="item-title">ABC公司 - 软件工程师</span>
  <span class="item-date">2022-至今</span>
</div>
<div class="item-content">
  <ul>
    <li>负责公司核心产品的开发维护</li>
    <li>实现了XX功能，提升了YY效率</li>
    <li>主导了ZZ项目的技术改造</li>
  </ul>
</div>

<div class="item-header">
  <span class="item-title">XYZ科技 - 实习工程师</span>
  <span class="item-date">2021.07-2021.09</span>
</div>
<div class="item-content">
  <ul>
    <li>参与开发移动端应用</li>
    <li>完成了功能模块的重构</li>
    <li>解决了多个性能问题</li>
  </ul>
</div>

<h2 class="section-title">
  <i class="fas fa-tools"></i>技能特长
</h2>
<div class="item-content">
  <ul>
    <li>编程语言：JavaScript, Python, Java</li>
    <li>框架：React, Vue, Spring Boot</li>
    <li>工具：Git, Docker, Kubernetes</li>
    <li>语言：英语（流利）</li>
  </ul>
</div>

<h2 class="section-title">
  <i class="fas fa-project-diagram"></i>项目经验
</h2>
<div class="item-header">
  <span class="item-title">企业管理系统</span>
  <span class="item-date">2023.01-2023.06</span>
</div>
<div class="item-content">
  <ul>
    <li>项目描述：基于React和Node.js的企业级管理系统</li>
    <li>主要职责：前端架构设计和核心模块开发</li>
    <li>技术栈：React, TypeScript, Node.js, MongoDB</li>
    <li>项目成果：提升了团队效率30%，获得客户好评</li>
  </ul>
</div>

<div class="item-header">
  <span class="item-title">移动端APP开发</span>
  <span class="item-date">2022.07-2022.12</span>
</div>
<div class="item-content">
  <ul>
    <li>项目描述：跨平台移动应用开发</li>
    <li>主要职责：负责核心功能模块开发</li>
    <li>技术栈：React Native, Redux, Firebase</li>
    <li>项目成果：应用在App Store获得4.5星评分</li>
  </ul>
</div>`;

  editor.textContent = template;
  updatePreview(template);

  // 文件导入处理
  fileInput.addEventListener('change', async function (e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const content = await readFile(file);
      if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        editor.textContent = content;
        updatePreview(content);
      } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        // 使用mammoth.js处理Word文档
        const result = await convertWordToMarkdown(file);
        editor.textContent = result;
        updatePreview(result);
      } else if (file.name.endsWith('.pdf')) {
        // 使用pdf.js处理PDF文档
        const result = await convertPDFToMarkdown(file);
        editor.textContent = result;
        updatePreview(result);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert('文件读取失败，请重试');
    }
  });

  // 编辑器内容变化时更新预览
  let updateTimeout;
  editor.addEventListener('input', function (e) {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      const content = e.target.textContent;
      updatePreview(content);
    }, 300);
  });

  // 文件读取函数
  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  // 更新预览
  function updatePreview(content) {
    preview.innerHTML = content;
  }

  // Word文档转换函数
  async function convertWordToMarkdown(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });

      // 将HTML转换为Markdown格式
      let markdown = result.value
        .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
        .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
        .replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n')
        .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
        .replace(/<ul>(.*?)<\/ul>/g, '$1\n')
        .replace(/<li>(.*?)<\/li>/g, '- $1\n')
        .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
        .replace(/<em>(.*?)<\/em>/g, '*$1*')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/&nbsp;/g, ' ');

      return markdown.trim();
    } catch (error) {
      console.error('Error converting Word document:', error);
      throw new Error('Word文档转换失败');
    }
  }

  // PDF文档转换函数
  async function convertPDFToMarkdown(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let markdown = '# ' + file.name.replace('.pdf', '') + '\n\n';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => item.str)
          .join(' ')
          .trim();

        markdown += pageText + '\n\n';
      }

      return markdown;
    } catch (error) {
      console.error('Error converting PDF:', error);
      throw new Error('PDF文档转换失败');
    }
  }

  // 导出Word文档
  exportDocBtn.addEventListener('click', async function () {
    try {
      const content = editor.textContent;
      const blob = await generateWord(content);
      downloadFile(blob, 'resume.docx');
    } catch (error) {
      console.error('Error exporting to Word:', error);
      alert('导出Word文档失败，请重试');
    }
  });

  // 导出PDF文档
  exportPdfBtn.addEventListener('click', async function () {
    try {
      const content = preview.innerHTML;
      const blob = await generatePDF(content);
      downloadFile(blob, 'resume.pdf');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('导出PDF文档失败，请重试');
    }
  });

  // 生成Word文档
  async function generateWord(content) {
    try {
      const doc = new docx.Document({
        sections: [
          {
            properties: {},
            children: [
              new docx.Paragraph({
                children: [new docx.TextRun(content)],
              }),
            ],
          },
        ],
      });

      const blob = await docx.Packer.toBlob(doc);
      return blob;
    } catch (error) {
      console.error('Error generating Word document:', error);
      throw new Error('Word文档生成失败');
    }
  }

  // 生成PDF文档
  async function generatePDF(content) {
    try {
      // 创建一个临时容器来存放格式化的内容
      const container = document.createElement('div');
      container.innerHTML = content;
      container.style.padding = '20px';
      container.style.fontSize = '12pt';

      // 配置PDF选项
      const opt = {
        margin: [10, 10],
        filename: 'resume.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      // 生成PDF
      const pdf = await html2pdf().set(opt).from(container).outputPdf('blob');
      return pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('PDF文档生成失败');
    }
  }

  // 文件下载函数
  function downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
});
