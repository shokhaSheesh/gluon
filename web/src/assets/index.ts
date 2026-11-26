/* Images exported from the Gluon Figma file (IEeGE0egSHKrdwwVqjXnoZ). */
import hayot from './figma/banks/hayot.svg';
import hayotMark from './figma/banks/hayot-mark.svg';
import aloqa from './figma/banks/aloqa.svg';
import aloqaMark from './figma/banks/aloqa-mark.svg';
import anor from './figma/banks/anor.svg';
import anorMark from './figma/banks/anor-mark.svg';
import sqb from './figma/banks/sqb.svg';
import sqbMark from './figma/banks/sqb-mark.svg';
import kapital from './figma/banks/kapital.png';
import kapitalMark from './figma/banks/kapital-mark.png';
import billz from './figma/services/billz.png';
import robosell from './figma/services/robosell.svg';
import smartup from './figma/services/smartup.svg';
import gcal from './figma/services/gcal.png';
import zoom from './figma/services/zoom.png';
import clients from './figma/archive/clients.png';
import products from './figma/archive/products.png';
import orders from './figma/archive/orders.png';
import locations from './figma/archive/locations.png';
import media from './figma/archive/media.png';
import reports from './figma/archive/reports.png';
import chats from './figma/archive/chats.png';
import categories from './figma/archive/categories.png';
import couriers from './figma/archive/couriers.png';
import blinchiki from './figma/food/blinchiki.jpg';
import sety from './figma/food/sety.jpg';
import chicken from './figma/food/chicken.jpg';
import salad from './figma/food/salad.jpg';
import soup from './figma/food/soup.jpg';
import drinks from './figma/food/drinks.jpg';
import watermelon from './figma/food/watermelon.jpg';
import pirozhki from './figma/food/pirozhki.jpg';
import sauce from './figma/food/sauce.jpg';
import xonim from './figma/food/xonim.jpg';
import promoBank from './figma/misc/promo-bank.png';
import productCase from './figma/misc/product-case.jpg';
import authHero from './figma/misc/auth-hero.jpg';
import billzOffer from './figma/misc/billz-offer.jpg';

/** bank id → wordmark + square mark */
export const BANK_LOGOS: Record<string, { word: string; mark: string }> = {
  hayot: { word: hayot, mark: hayotMark },
  aloqa: { word: aloqa, mark: aloqaMark },
  anor: { word: anor, mark: anorMark },
  sqb: { word: sqb, mark: sqbMark },
  kapital: { word: kapital, mark: kapitalMark },
};

/** brand name (as used in data) → square logo; used by BrandMark automatically */
export const LOGO_BY_NAME: Record<string, string> = {
  Billz: billz,
  Robosell: robosell,
  Smartup: smartup,
  'Google Calendar': gcal,
  Zoom: zoom,
  'Hayot Bank': hayotMark,
  Aloqabank: aloqaMark,
  Anorbank: anorMark,
  SQB: sqbMark,
  Kapitalbank: kapitalMark,
};

export const ARCHIVE_ICONS = { clients, products, orders, locations, media, reports, chats, categories, couriers };
export const FOOD = { blinchiki, sety, chicken, salad, soup, drinks, watermelon, pirozhki, sauce, xonim };
export const IMAGES = { promoBank, productCase, authHero, billzOffer };
