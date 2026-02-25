const yearElement = document.getElementById('year');
const form = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

if (form && formMessage) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const companyName = formData.get('company');

    formMessage.textContent = `Thanks${companyName ? `, ${companyName}` : ''}. Your system inquiry has been received.`;
    form.reset();
  });
}
