// Gera um PDF A4 a partir do mesmo bloco usado na impressão.
// As bibliotecas são carregadas só quando alguém clica em "Baixar PDF".

const LARGURA_PX = 794 // largura de uma folha A4 a 96 dpi
const MARGEM_MM = 14 // igual ao @page do index.css

async function gerarPdf(origem: HTMLElement) {
  const [{ toJpeg }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')])

  // O bloco de impressão fica escondido na tela; uma cópia é montada fora da área visível
  const palco = document.createElement('div')
  palco.style.cssText = `position:fixed;left:-10000px;top:0;width:${LARGURA_PX}px;background:#fff`
  const copia = origem.cloneNode(true) as HTMLElement
  copia.classList.remove('hidden')
  copia.style.display = 'block'
  palco.appendChild(copia)
  document.body.appendChild(palco)

  try {
    await Promise.all([...copia.querySelectorAll('img')].map((img) => (img.complete ? null : new Promise((ok) => { img.onload = img.onerror = ok }))))
    const imagem = await toJpeg(copia, { pixelRatio: 2, quality: 0.9, backgroundColor: '#ffffff' })

    const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
    const larguraPag = pdf.internal.pageSize.getWidth()
    const alturaPag = pdf.internal.pageSize.getHeight()
    const larguraImg = larguraPag - MARGEM_MM * 2
    const alturaImg = (copia.offsetHeight / copia.offsetWidth) * larguraImg
    const alturaUtil = alturaPag - MARGEM_MM * 2

    // Conteúdo maior que uma folha continua nas páginas seguintes
    for (let y = 0; y < alturaImg; y += alturaUtil) {
      if (y > 0) pdf.addPage()
      pdf.addImage(imagem, 'JPEG', MARGEM_MM, MARGEM_MM - y, larguraImg, alturaImg)
      if (alturaImg > alturaUtil) {
        // Esconde o que vazou para as margens de cima e de baixo
        pdf.setFillColor(255, 255, 255)
        pdf.rect(0, 0, larguraPag, MARGEM_MM, 'F')
        pdf.rect(0, alturaPag - MARGEM_MM, larguraPag, MARGEM_MM, 'F')
      }
    }
    return pdf.output('blob')
  } finally {
    palco.remove()
  }
}

export async function baixarPdf(origem: HTMLElement, nomeArquivo: string) {
  salvar(await gerarPdf(origem), nomeArquivo)
}

function salvar(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
