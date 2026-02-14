;(function () {
  'use strict'

  // Конфигурация
  var CONFIG = {
    terms: {
      url: 'https://legal.skyeng.ru/doc/describe/2068', // статичная ссылка на API
      textToFind: 'персональных данных', // текст для поиска в чекбоксе
      fallbackLink:
        'https://legal.skyeng.ru/upload/document-version-pdf/1BcCZSVE/NkS-8hoq/Icjjk9vw/OOSkLtYz/original/4050.pdf', // запасная ссылка
    },
    adv: {
      url: 'https://legal.skyeng.ru/doc/describe/2066', // статичная ссылка на API
      textToFind: 'рекламных материалов', // текст для поиска в чекбоксе
      fallbackLink:
        'https://legal.skyeng.ru/upload/document-version-pdf/VJ0cRv8U/j1K207LU/8JqOoUkY/InLIltOn/original/4051.pdf', // запасная ссылка
    },
  }

  // Кеш для загруженных данных
  var legalCache = {}

  // Загрузка данных с fallback
  function fetchLegalData(item, callback) {
    var url = item.url

    // Если уже загружали и есть данные
    if (legalCache[url] && legalCache[url].link) {
      callback(legalCache[url])
      return
    }

    var TIMEOUT_MS = 3000
    var settled = false

    // Запасной вариант на случай таймаута
    var timeoutId = setTimeout(function () {
      if (settled) return
      settled = true

      var fallbackData = {
        link: item.fallbackLink,
      }

      legalCache[url] = fallbackData
      callback(fallbackData)
    }, TIMEOUT_MS)

    // Запрос к API
    fetch(url, { method: 'GET' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status)
        return response.json()
      })
      .then(function (data) {
        clearTimeout(timeoutId)
        if (settled) return
        settled = true

        var realData = {
          link: data.link || item.fallbackLink,
        }

        legalCache[url] = realData
        callback(realData)
      })
      .catch(function () {
        clearTimeout(timeoutId)
        if (settled) return
        settled = true

        var fallbackData = {
          link: item.fallbackLink,
        }

        legalCache[url] = fallbackData
        callback(fallbackData)
      })
  }

  // Поиск и обновление ссылок
  function updateCheckboxLinks() {
    // Обрабатываем каждый тип документа из конфига
    Object.keys(CONFIG).forEach(function (key) {
      var item = CONFIG[key]

      // Находим все чекбоксы, содержащие нужный текст
      var checkboxes = document.querySelectorAll('.t-checkbox__labeltext')

      checkboxes.forEach(function (labelElement) {
        var text = labelElement.textContent || ''

        // Проверяем, содержит ли текст искомую фразу
        if (text.indexOf(item.textToFind) === -1) return

        // Находим ссылку внутри этого элемента
        var link = labelElement.querySelector('a')
        if (!link) return

        // Сохраняем текущий href для проверки изменений
        var currentHref = link.getAttribute('href')

        // Загружаем актуальные данные и обновляем ссылку
        fetchLegalData(item, function (data) {
          if (data.link && data.link !== currentHref) {
            link.setAttribute('href', data.link)
          }
        })
      })
    })
  }

  // Запуск при загрузке страницы
  function init() {
    // Первое обновление
    updateCheckboxLinks()

    // Наблюдаем за изменениями в DOM (на случай динамической подгрузки)
    var observer = new MutationObserver(function () {
      updateCheckboxLinks()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }

  document.addEventListener('DOMContentLoaded', init)
})()
