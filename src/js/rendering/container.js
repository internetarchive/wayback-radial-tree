export function renderContainer() {
  let content = creatDiv();
  content.setAttribute('class', 'rt-content');
  let divBtn = creatDiv();
  divBtn.setAttribute('class', 'div-btn');

  let sequence = creatDiv();
  sequence.setAttribute('class', 'sequence');
  let chart = creatDiv();
  chart.setAttribute('id', 'chart');
  content.appendChild(divBtn);
  content.appendChild(sequence);
  content.appendChild(chart);
  content.style.display = 'block';
  return content;
}
function creatDiv(){
  let newDiv=document.createElement('div');
  return newDiv;
}