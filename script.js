document.addEventListener('DOMContentLoaded', function () {
  const fileInput = document.getElementById('fileInput');
  const editor = document.getElementById('editor');
  const preview = document.getElementById('preview');
  const exportDocBtn = document.getElementById('exportDoc');
  const exportPdfBtn = document.getElementById('exportPdf');
  // const resizer = document.getElementById('resizer');
  // const editorContainer = document.querySelector('.editor-container');

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

  // 从模板中获取初始内容
  const template = document.getElementById('resumeTemplate').innerHTML;

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

  // 生成PDF文档(其中照片不显示，图片URL是可以公开访问的，如果是本地图片，建议使用base64格式)
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
        html2canvas: {
          scale: 2,
          useCORS: true, // 允许跨域，1.要添加了useCORS和allowTaint选项来处理跨域图片
          allowTaint: true, // 允许图片跨域
          logging: true, // 开启日志以便调试
          imageTimeout: 0, // 禁用图片加载超时
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      // 先等待图片加载完成（2.添加了图片预加载逻辑，确保所有图片都加载完成后再生成PDF）
      const images = container.getElementsByTagName('img');
      await Promise.all(
        Array.from(images).map((img) => {
          return new Promise((resolve, reject) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = resolve;
              img.onerror = reject;
            }
          });
        })
      );

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
