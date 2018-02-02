export function renderContainer() {
  let content = document.createElement('div');
  content.setAttribute('class', 'rt-content');
  let divBtn = document.createElement('div');
  divBtn.setAttribute('class', 'div-btn');

  let sequence = document.createElement('p');
  sequence.setAttribute('class', 'sequence');
  let chart = document.createElement('div');
  chart.setAttribute('id', 'chart');
  content.appendChild(divBtn);
  content.appendChild(sequence);
  content.appendChild(chart);
  content.style.display = 'block';
  return content;
}
