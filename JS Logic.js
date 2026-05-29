document.getElementById('addQualificationBtn').addEventListener('click', () => {
  const degree = document.getElementById('qDegree').value;
  const field = document.getElementById('qField').value;
  const institute = document.getElementById('qInstitute').value;
  const gradDate = document.getElementById('qGradDate').value;

  const q = { degree, field, institute, graduationDate: gradDate };
  // Save to backend via API or localStorage demo
  const list = document.getElementById('qualificationList');
  const div = document.createElement('div');
  div.className = 'item';
  div.innerHTML = `<strong>${degree}</strong> in ${field} from ${institute} (${gradDate})`;
  list.appendChild(div);
});