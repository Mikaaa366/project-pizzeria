
import { templates, select, classNames } from '../settings.js';
import utils from '../utils.js';

class home {
  constructor(element) {
    const thisHome = this;
    thisHome.render(element);
    thisHome.initPlugin();
  }

  render(element) {
    const thisHome = this;
    const generatedHTML = templates.home();

    thisHome.dom = {};
    thisHome.dom.wrapper = element;
    thisHome.dom.wrapper.innerHTML = generatedHTML;

    thisHome.element = utils.createDOMFromHTML(generatedHTML);

    thisHome.pages = document.querySelector(select.containerOf.pages).children;
    thisHome.navLinks = document.querySelectorAll(select.nav.links);
    thisHome.homeLinks = document.querySelectorAll(select.nav.homeLinks);

    const idFromHash = window.location.hash.replace('#/', '');

    let pageMatchingHash = thisHome.pages[0].id;

    for (let page of thisHome.pages) {
      if (page.id == idFromHash) {
        pageMatchingHash = page.id;
        break;
      }
    }
    thisHome.activatePage(pageMatchingHash);

    for (let link of thisHome.homeLinks) {
      link.addEventListener('click', function (event) {
        const clickedElement = this;
        event.preventDefault();
        /* get page id from href attribute */
        const id = clickedElement.getAttribute('href').replace('#', '');
        /* run this.App.activatePage with that id */
        thisHome.activatePage(id);
        /* change URL hash */
        window.location.hash = '#/' + id;
      });
    }
  }
  activatePage(pageId) {
    const thisHome = this;

    /* add class 'active' to matching pages, remove from non-matching */
    for (let page of thisHome.pages) {
      page.classList.toggle(classNames.pages.active, page.id == pageId);
    }

    /* add class 'active' to matching links, remove from non-matching */
    for (let link of thisHome.navLinks) {
      link.classList.toggle(
        classNames.nav.active,
        link.getAttribute('href') == '#' + pageId
      );
    }
  }

  initPlugin() {
    const elem = document.querySelector(select.carousel);

    var flkty = new Flickity(elem, {
      cellAlign: 'left',
      contain: true,
      autoPlay: 3000,
    });
    console.log('flkty:', flkty);
  }
}

export default home;
