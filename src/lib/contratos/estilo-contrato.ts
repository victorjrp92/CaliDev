/**
 * Estilos del contrato, limitados a `.contrato` para no tocar la página que
 * lo muestra. Usan las fuentes del sitio (Archivo y Plex Mono) y en pantallas
 * angostas pasan a una columna.
 */
export const ESTILO_CONTRATO = `
.contrato{--ink:#0B1813;--deep:#046A4E;--brand:#00D492;--mint:#E3F7EE;--paper:#F3F7F4;--gris:#4A5A53;--linea:#D5DED9;--amber:#FFC24A;--red:#D93636}
.contrato *{box-sizing:border-box}
.contrato{margin:0;font-family:var(--font-archivo),Arial,sans-serif;font-size:15px;line-height:1.55;color:var(--ink);background:#fff}
.contrato h1,.contrato h2,.contrato h3{font-family:var(--font-archivo),Arial,sans-serif;letter-spacing:-.02em;margin:0;text-wrap:balance}
.contrato .mono{font-family:var(--font-plex),monospace;font-variant-numeric:tabular-nums}
.contrato .eyebrow{font-family:var(--font-plex),monospace;font-size:8pt;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--deep)}
.contrato p{margin:0}
  /* Portada */
.contrato .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid var(--ink);padding-bottom:10px}
.contrato .marca{font-family:var(--font-archivo);font-weight:800;font-size:15pt}
.contrato .marca span{color:var(--deep)}
.contrato .fecha{text-align:right;font-size:9pt;color:var(--gris)}
.contrato .titulo{margin-top:22px}
.contrato .titulo h1{font-size:30pt;line-height:1.02;margin-top:6px}
.contrato .titulo p{margin-top:10px;font-size:12pt;color:var(--gris);max-width:58ch}
.contrato .ahorro{margin-top:22px;background:var(--ink);color:#fff;border-radius:16px;padding:20px 24px;display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:center}
.contrato .ahorro .num{font-family:var(--font-plex);font-weight:800;font-size:34pt;letter-spacing:-.04em;color:var(--brand);line-height:1}
.contrato .ahorro p{font-size:11pt;color:#CFE3D9}
.contrato .ahorro b{color:#fff}
.contrato .regalos{margin-top:18px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.contrato .regalo{border:1.5px solid var(--linea);border-radius:12px;padding:12px 14px;break-inside:avoid}
.contrato .regalo.hl{border-color:var(--brand);background:var(--mint)}
.contrato .regalo .k{font-size:9.5pt;color:var(--gris)}
.contrato .regalo .v{font-family:var(--font-archivo);font-weight:800;font-size:15pt;margin-top:2px}
.contrato .regalo .was{font-family:var(--font-plex);font-size:9pt;color:#7A8A83;text-decoration:line-through;text-decoration-color:var(--red);text-decoration-thickness:1.5px;margin-left:6px;font-weight:500}
.contrato .regalo .d{font-size:9.5pt;color:var(--ink);margin-top:3px}
.contrato section{margin-top:26px;break-inside:avoid-page}
.contrato section h2{font-size:16pt;margin-top:4px}
.contrato section .lead{margin-top:6px;color:var(--gris);max-width:70ch}
.contrato table{width:100%;border-collapse:collapse;margin-top:10px}
.contrato th{text-align:left;font-family:var(--font-plex);font-size:7.5pt;letter-spacing:.12em;text-transform:uppercase;color:var(--gris);font-weight:700;padding:6px 8px;border-bottom:1.5px solid var(--ink)}
.contrato td{padding:8px;border-bottom:1px solid var(--linea);vertical-align:top}
.contrato td.r,.contrato th.r{text-align:right}
.contrato tr.destacar td{background:var(--mint);font-weight:700}
.contrato .tag{display:inline-block;font-family:var(--font-plex);font-size:7.5pt;font-weight:800;letter-spacing:.1em;text-transform:uppercase;background:var(--brand);color:var(--ink);border-radius:999px;padding:2px 8px}
.contrato .entregas{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}
.contrato .entrega{border-top:3px solid var(--deep);padding-top:8px}
.contrato .entrega .n{font-family:var(--font-plex);font-weight:800;color:var(--deep);font-size:9pt}
.contrato .entrega h3{font-size:11.5pt;margin-top:2px}
.contrato .entrega p{font-size:9.5pt;color:var(--gris);margin-top:3px}
.contrato .fin{margin-top:14px;border-left:4px solid var(--brand);background:var(--paper);padding:10px 14px;border-radius:0 10px 10px 0}
.contrato .lista{margin:8px 0 0;padding-left:18px}
.contrato .lista li{margin-top:3px}
  /* Lo que acordamos: sobrio, legible */
.contrato .acuerdo{margin-top:30px;break-before:page}
.contrato .acuerdo h2{font-size:14pt}
.contrato .acuerdo .lead{font-size:9.5pt}
.contrato .clausulas{margin-top:12px;columns:2;column-gap:22px;font-size:9.5pt;line-height:1.5}
.contrato .cl{break-inside:avoid;margin-bottom:10px}
.contrato .cl h3{font-family:var(--font-archivo);font-weight:700;font-size:9.5pt;letter-spacing:0}
.contrato .cl p{margin-top:2px;color:#26332D}
  .contrato .clausulas{font-size:14px}
  .contrato .acuerdo .lead{font-size:14px}
  @media print{.contrato{font-size:10.5pt}.contrato .clausulas,.contrato .acuerdo .lead{font-size:9.5pt}}
  @media (max-width:640px){
    .contrato .top{flex-wrap:wrap;gap:6px}
    .contrato .fecha{text-align:left}
    .contrato .titulo h1{font-size:30px}
    .contrato .ahorro{grid-template-columns:1fr;gap:10px;padding:18px}
    .contrato .ahorro .num{font-size:36px}
    .contrato .regalos{grid-template-columns:1fr}
    .contrato .entregas{grid-template-columns:1fr 1fr;row-gap:16px}
    .contrato .clausulas{columns:1}
    .contrato table{font-size:13px}
    .contrato td,.contrato th{padding:7px 4px}
  }
`;
