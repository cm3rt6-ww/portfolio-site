/* Замените примеры своими данными. Пустые поля email, telegram, url и image можно оставить пустыми. */
window.PORTFOLIO_CONTENT = {
  name: 'Идрис',
  heroIntro: 'Привет, я Идрис. Здесь собраны мои идеи, проекты и истории, которыми хочется поделиться.',
  aboutLead: 'Каждая секунда на сайте стоит денег. Пока вы выбираете дизайн сайта, клиент уже ушёл тому, у кого страница выглядит дороже.',
  aboutText: 'Моя задача — создать выразительный и удобный сайт, который вызывает доверие, помогает разобраться в вашем предложении и побуждает человека остаться и оставить заявку.',

  /* Ссылку url и путь к изображению image можно указать позднее.
     Для реальных проектов измените placeholder на false. */
  projects: [
    { title: 'Проект 01', category: 'Видеопроект', description: 'Посмотрите видео проекта.', url: '', image: '', video: 'assets/project-01.mp4', placeholder: false },
    { title: 'Проект 02', category: '', description: '', url: '', image: '', video: 'assets/project-02.mp4', placeholder: false },
    { title: 'Проект 03', category: 'Видеопроект', description: 'Версии для компьютера и телефона.', url: '', image: '', video: 'assets/project-03-desktop.mp4', mobileVideo: 'assets/project-03-mobile.mp4', placeholder: false }
  ],

  /* Добавляйте только настоящие отзывы, например:
     { text: 'Текст отзыва', author: 'Имя автора', detail: 'Название проекта' } */
  reviews: [],

  /* Примеры формата: 'hello@example.com' и 'https://t.me/username'. */
  email: '',
  telegram: 'https://t.me/Idriscode'
};
