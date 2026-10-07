document.addEventListener('DOMContentLoaded', () => {
  const whatsappPhone = '559991699532';
  const sessionKey = 'drLarissonPatientSession';
  const feedback = document.getElementById('login-feedback');
  const navToggle = document.querySelector('.nav-toggle');
  const navList = document.querySelector('.nav-list');

  function showLoginFeedback(message, type = '') {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.classList.remove('error', 'success');
    if (type) feedback.classList.add(type);
  }

  function closeMenu() {
    if (!navToggle || !navList) return;
    navToggle.setAttribute('aria-expanded', 'false');
    const menuLabel = navToggle.querySelector('.sr-only');
    if (menuLabel) menuLabel.textContent = 'Abrir menu';
    navList.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }

  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      const menuLabel = navToggle.querySelector('.sr-only');
      if (menuLabel) menuLabel.textContent = expanded ? 'Abrir menu' : 'Fechar menu';
      navList.classList.toggle('active', !expanded);
      document.body.classList.toggle('no-scroll', !expanded);
    });

    navList.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  const carouselTrack = document.querySelector('.carousel-track');
  const carousel = document.querySelector('.testimonial-carousel');
  const testimonials = carouselTrack ? Array.from(carouselTrack.children) : [];
  const previousButton = document.querySelector('.carousel-control.prev');
  const nextButton = document.querySelector('.carousel-control.next');
  let currentIndex = 0;

  if (carouselTrack && testimonials.length && previousButton && nextButton) {
    const updateCarousel = () => {
      carouselTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
      testimonials.forEach((item, index) => {
        item.setAttribute('aria-hidden', String(index !== currentIndex));
      });
    };

    previousButton.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
      updateCarousel();
    });

    nextButton.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % testimonials.length;
      updateCarousel();
    });

    let touchStartX = null;
    carouselTrack.addEventListener('touchstart', event => {
      touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });

    carouselTrack.addEventListener('touchend', event => {
      if (touchStartX === null) return;
      const delta = event.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(delta) < 45) return;
      currentIndex = (currentIndex + (delta < 0 ? 1 : -1) + testimonials.length) % testimonials.length;
      updateCarousel();
    }, { passive: true });

    updateCarousel();
  } else if (carousel) {
    carousel.hidden = true;
  }

  const year = document.getElementById('ano-atual');
  if (year) year.textContent = String(new Date().getFullYear());

  const revealTargets = document.querySelectorAll(
    '.section-header, .card-mito, .card-via, .timeline-step, .pricing-card, .testimonial, .references, .login-container, .contact-form, .contact-info'
  );
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('fade-in-up');
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.1 });

    revealTargets.forEach(target => observer.observe(target));
  }

  const whatsappFloat = document.querySelector('.whatsapp-float');
  if (whatsappFloat) {
    let lastScrollTop = window.scrollY;
    window.addEventListener('scroll', () => {
      const scrollTop = Math.max(0, window.scrollY);
      const scrollingDown = scrollTop > lastScrollTop && scrollTop > 240;
      whatsappFloat.classList.toggle('hidden', scrollingDown);
      lastScrollTop = scrollTop;
    }, { passive: true });
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async event => {
      event.preventDefault();
      const username = String(loginForm.elements.username.value || '').trim();
      const password = String(loginForm.elements.password.value || '');

      if (!username || password.length < 6) {
        showLoginFeedback('Informe seu e-mail/CPF e uma senha com pelo menos 6 caracteres.', 'error');
        return;
      }

      const submitButton = loginForm.querySelector('[type="submit"]');
      if (submitButton) submitButton.disabled = true;
      showLoginFeedback('Verificando acesso...');

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login: username, password })
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          showLoginFeedback(result.error || 'Não foi possível validar o acesso. Confira os dados ou fale com a equipe.', 'error');
          return;
        }

        sessionStorage.setItem(sessionKey, JSON.stringify({
          ...result.patient,
          token: result.token,
          login: username,
          mode: 'api',
          startedAt: new Date().toISOString()
        }));

        if (result.dashboardUrl) {
          window.location.assign(result.dashboardUrl);
          return;
        }

        showLoginFeedback('Acesso validado. A área do paciente está sendo preparada; fale com a equipe para continuar.', 'success');
      } catch {
        showLoginFeedback('O serviço de acesso está indisponível neste momento. Entre em contato pelo WhatsApp.', 'error');
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  const demoButton = document.getElementById('demo-login-btn');
  if (demoButton) {
    demoButton.addEventListener('click', () => {
      showLoginFeedback('A demonstração da área do paciente será disponibilizada quando o painel for restaurado.', 'success');
    });
  }

  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;

      const values = new FormData(contactForm);
      const name = String(values.get('nome') || '').trim();
      const phone = String(values.get('telefone') || '').trim();
      const email = String(values.get('email') || '').trim();
      const city = String(values.get('cidade') || '').trim();
      const interestField = contactForm.elements.interesse;
      const interest = interestField.options[interestField.selectedIndex]?.text || '';
      const message = String(values.get('mensagem') || '').trim();

      const whatsappMessage = [
        'Olá, gostaria de agendar uma avaliação.',
        '',
        `Nome: ${name}`,
        `WhatsApp: ${phone}`,
        email ? `E-mail: ${email}` : '',
        city ? `Cidade/Estado: ${city}` : '',
        interest ? `Motivo principal: ${interest}` : '',
        message ? `Mensagem: ${message}` : ''
      ].filter(Boolean).join('\n');

      window.location.assign(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`);
    });
  }
});
