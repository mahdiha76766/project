/* global use, db, print, printjson */
// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use('nedicon1_web');

/**
 * اصلاح محصولات بر اساس فایل مرجع:
 * products_upload_20260728_103435.xlsx
 *
 * - نام / وزن / قیمت دقیقاً مطابق اکسل مرجع
 * - هر source_row = یک محصول جدا (مثلاً دو ردیف روغن کرچک)
 * - حذف واریانت‌های اشتباه مثل ۱۰۰گرم / ۲۰۰گرم
 * - مثال: فلفل قرمز ایرانی + کیلو = ۶۰۰٬۰۰۰ تومان
 *
 * قبل از اجرا از DB بکاپ بگیرید.
 * کل این فایل را در Playground اجرا کنید.
 */

const CANONICAL_GROUPS = [
  {
    "sourceRow": 29,
    "name": "آرد برنج",
    "slug": "rice_flour",
    "variants": [
      {
        "sku": "NS-0034-1",
        "name": "کیلو",
        "price": 295000,
        "containerSize": "کیلو",
        "portalPrice": 295000
      }
    ]
  },
  {
    "sourceRow": 30,
    "name": "آرد سوخاری",
    "slug": "breadcrumbs",
    "variants": [
      {
        "sku": "NS-0035-1",
        "name": "کیلو",
        "price": 290000,
        "containerSize": "کیلو",
        "portalPrice": 290000
      }
    ]
  },
  {
    "sourceRow": 31,
    "name": "آرد نخودچی",
    "slug": "chickpea_flour",
    "variants": [
      {
        "sku": "NS-0036-1",
        "name": "کیلو",
        "price": 390000,
        "containerSize": "کیلو",
        "portalPrice": 390000
      }
    ]
  },
  {
    "sourceRow": 52,
    "name": "بکینگ پودر",
    "slug": "baking_powder",
    "variants": [
      {
        "sku": "NS-0049-1",
        "name": "کیلو",
        "price": 400000,
        "containerSize": "کیلو",
        "portalPrice": 400000
      }
    ]
  },
  {
    "sourceRow": 389,
    "name": "نشاسته ذرت",
    "slug": "corn_starch",
    "variants": [
      {
        "sku": "NS-0371-1",
        "name": "کیلو",
        "price": 270000,
        "containerSize": "کیلو",
        "portalPrice": 270000
      }
    ]
  },
  {
    "sourceRow": 375,
    "name": "گندم",
    "slug": "wheat",
    "variants": [
      {
        "sku": "NS-0372-1",
        "name": "کیلو",
        "price": 80000,
        "containerSize": "کیلو",
        "portalPrice": 80000
      },
      {
        "sku": "NS-0382-1",
        "name": "کیلویی",
        "price": 1500000,
        "containerSize": "کیلویی",
        "portalPrice": 1500000
      },
      {
        "sku": "NS-0382-2",
        "name": "بسته بندی",
        "price": 260000,
        "containerSize": "بسته بندی",
        "portalPrice": 260000
      }
    ]
  },
  {
    "sourceRow": 212,
    "name": "ژلاتین",
    "slug": "gelatin",
    "variants": [
      {
        "sku": "NS-0201-1",
        "name": "کیلو",
        "price": 910000,
        "containerSize": "کیلو",
        "portalPrice": 910000
      }
    ]
  },
  {
    "sourceRow": 5,
    "name": "ادویه آبگوشتی",
    "slug": "spice_abgoosht",
    "variants": [
      {
        "sku": "NS-0003-1",
        "name": "کیلو",
        "price": 900000,
        "containerSize": "کیلو",
        "portalPrice": 900000
      }
    ]
  },
  {
    "sourceRow": 6,
    "name": "ادویه استیک",
    "slug": "spice_steak",
    "variants": [
      {
        "sku": "NS-0001-1",
        "name": "کیلو",
        "price": 1150000,
        "containerSize": "کیلو",
        "portalPrice": 1150000
      }
    ]
  },
  {
    "sourceRow": 7,
    "name": "ادویه الویه",
    "slug": "spice_olivieh",
    "variants": [
      {
        "sku": "NS-0002-1",
        "name": "کیلو",
        "price": 900000,
        "containerSize": "کیلو",
        "portalPrice": 900000
      }
    ]
  },
  {
    "sourceRow": 11,
    "name": "ادویه ترشی",
    "slug": "spice_pickle",
    "variants": [
      {
        "sku": "NS-0007-1",
        "name": "کیلو",
        "price": 850000,
        "containerSize": "کیلو",
        "portalPrice": 850000
      }
    ]
  },
  {
    "sourceRow": 12,
    "name": "ادویه تند",
    "slug": "spice_hot",
    "variants": [
      {
        "sku": "NS-0008-1",
        "name": "کیلو",
        "price": 900000,
        "containerSize": "کیلو",
        "portalPrice": 900000
      }
    ]
  },
  {
    "sourceRow": 14,
    "name": "ادویه دود",
    "slug": "spice_smoked",
    "variants": [
      {
        "sku": "NS-0010-1",
        "name": "کیلو",
        "price": 1100000,
        "containerSize": "کیلو",
        "portalPrice": 1100000
      }
    ]
  },
  {
    "sourceRow": 15,
    "name": "ادویه سالاد ایتالیایی",
    "slug": "spice_salad_italian",
    "variants": [
      {
        "sku": "NS-0011-1",
        "name": "کیلو",
        "price": 950000,
        "containerSize": "کیلو",
        "portalPrice": 950000
      }
    ]
  },
  {
    "sourceRow": 16,
    "name": "ادویه سس سزار",
    "slug": "spice_sauce_caesar",
    "variants": [
      {
        "sku": "NS-0012-1",
        "name": "کیلو",
        "price": 950000,
        "containerSize": "کیلو",
        "portalPrice": 950000
      }
    ]
  },
  {
    "sourceRow": 17,
    "name": "ادویه سیب پنیری",
    "slug": "spice_apple_cheese",
    "variants": [
      {
        "sku": "NS-0013-1",
        "name": "کیلو",
        "price": 1100000,
        "containerSize": "کیلو",
        "portalPrice": 1100000
      }
    ]
  },
  {
    "sourceRow": 18,
    "name": "ادویه سیر و کره",
    "slug": "spice_garlic_v_butter",
    "variants": [
      {
        "sku": "NS-0014-1",
        "name": "کیلو",
        "price": 990000,
        "containerSize": "کیلو",
        "portalPrice": 990000
      }
    ]
  },
  {
    "sourceRow": 19,
    "name": "ادویه عربی",
    "slug": "spice_arabic",
    "variants": [
      {
        "sku": "NS-0015-1",
        "name": "کیلو",
        "price": 1100000,
        "containerSize": "کیلو",
        "portalPrice": 1100000
      }
    ]
  },
  {
    "sourceRow": 20,
    "name": "ادویه فلافل",
    "slug": "spice_falafel",
    "variants": [
      {
        "sku": "NS-0016-1",
        "name": "کیلو",
        "price": 990000,
        "containerSize": "کیلو",
        "portalPrice": 990000
      }
    ]
  },
  {
    "sourceRow": 21,
    "name": "ادویه قرمه سبزی",
    "slug": "spice_ghormeh_sabzi",
    "variants": [
      {
        "sku": "NS-0017-1",
        "name": "کیلو",
        "price": 950000,
        "containerSize": "کیلو",
        "portalPrice": 950000
      }
    ]
  },
  {
    "sourceRow": 26,
    "name": "ادویه لیمو فلفلی",
    "slug": "spice_lemon_peppermint",
    "variants": [
      {
        "sku": "NS-0021-1",
        "name": "کیلو",
        "price": 950000,
        "containerSize": "کیلو",
        "portalPrice": 950000
      }
    ]
  },
  {
    "sourceRow": 27,
    "name": "ادویه ماهی",
    "slug": "spice_fish",
    "variants": [
      {
        "sku": "NS-0022-1",
        "name": "کیلو",
        "price": 1500000,
        "containerSize": "کیلو",
        "portalPrice": 1500000
      }
    ]
  },
  {
    "sourceRow": 28,
    "name": "ادویه مرغ",
    "slug": "spice_chicken",
    "variants": [
      {
        "sku": "NS-0023-1",
        "name": "کیلو",
        "price": 1100000,
        "containerSize": "کیلو",
        "portalPrice": 1100000
      }
    ]
  },
  {
    "sourceRow": 8,
    "name": "ادویه پلویی",
    "slug": "spice_polo",
    "variants": [
      {
        "sku": "NS-0004-1",
        "name": "کیلو",
        "price": 900000,
        "containerSize": "کیلو",
        "portalPrice": 900000
      }
    ]
  },
  {
    "sourceRow": 9,
    "name": "ادویه پنیر فرانسه",
    "slug": "spice_cheese_french",
    "variants": [
      {
        "sku": "NS-0005-1",
        "name": "کیلو",
        "price": 1200000,
        "containerSize": "کیلو",
        "portalPrice": 1200000
      }
    ]
  },
  {
    "sourceRow": 10,
    "name": "ادویه پیاز و سبزیجات",
    "slug": "spice_onion_v_vegetables",
    "variants": [
      {
        "sku": "NS-0006-1",
        "name": "کیلو",
        "price": 990000,
        "containerSize": "کیلو",
        "portalPrice": 990000
      }
    ]
  },
  {
    "sourceRow": 13,
    "name": "ادویه چدار",
    "slug": "spice_cheddar",
    "variants": [
      {
        "sku": "NS-0009-1",
        "name": "کیلو",
        "price": 890000,
        "containerSize": "کیلو",
        "portalPrice": 890000
      }
    ]
  },
  {
    "sourceRow": 23,
    "name": "ادویه کاری",
    "slug": "spice_curry",
    "variants": [
      {
        "sku": "NS-0019-1",
        "name": "کیلو",
        "price": 990000,
        "containerSize": "کیلو",
        "portalPrice": 990000
      }
    ]
  },
  {
    "sourceRow": 22,
    "name": "ادویه کاچی",
    "slug": "spice_kachi",
    "variants": [
      {
        "sku": "NS-0018-1",
        "name": "کیلو",
        "price": 990000,
        "containerSize": "کیلو",
        "portalPrice": 990000
      }
    ]
  },
  {
    "sourceRow": 24,
    "name": "ادویه کره",
    "slug": "spice_butter",
    "variants": [
      {
        "sku": "NS-0020-1",
        "name": "کیلو",
        "price": 1100000,
        "containerSize": "کیلو",
        "portalPrice": 1100000
      }
    ]
  },
  {
    "sourceRow": 119,
    "name": "دارچین سیگاری",
    "slug": "cinnamon_cigar",
    "variants": [
      {
        "sku": "NS-0111-1",
        "name": "کیلو",
        "price": 1900000,
        "containerSize": "کیلو",
        "portalPrice": 1900000
      }
    ]
  },
  {
    "sourceRow": 121,
    "name": "دارچین گل سرخی",
    "slug": "cinnamon_flower_red",
    "variants": [
      {
        "sku": "NS-0113-1",
        "name": "کیلو",
        "price": 850000,
        "containerSize": "کیلو",
        "portalPrice": 850000
      }
    ]
  },
  {
    "sourceRow": 125,
    "name": "رازیانه",
    "slug": "fennel",
    "variants": [
      {
        "sku": "NS-0117-1",
        "name": "کیلو",
        "price": 460000,
        "containerSize": "کیلو",
        "portalPrice": 460000
      }
    ]
  },
  {
    "sourceRow": 203,
    "name": "زردچوبه چارمنار",
    "slug": "turmeric_chahar_menar",
    "variants": [
      {
        "sku": "NS-0192-1",
        "name": "کیلو",
        "price": 930000,
        "containerSize": "کیلو",
        "portalPrice": 930000
      }
    ]
  },
  {
    "sourceRow": 208,
    "name": "زنجبیل",
    "slug": "ginger",
    "variants": [
      {
        "sku": "NS-0197-1",
        "name": "کیلو",
        "price": 1200000,
        "containerSize": "کیلو",
        "portalPrice": 1200000
      }
    ]
  },
  {
    "sourceRow": 210,
    "name": "زیره سبز",
    "slug": "cumin_green",
    "variants": [
      {
        "sku": "NS-0199-1",
        "name": "کیلو",
        "price": 750000,
        "containerSize": "کیلو",
        "portalPrice": 750000
      }
    ]
  },
  {
    "sourceRow": 211,
    "name": "زیره سیاه",
    "slug": "cumin_black",
    "variants": [
      {
        "sku": "NS-0200-1",
        "name": "کیلو",
        "price": 3100000,
        "containerSize": "کیلو",
        "portalPrice": 3100000
      }
    ]
  },
  {
    "sourceRow": 217,
    "name": "سفیده تخم مرغ",
    "slug": "egg_white",
    "variants": [
      {
        "sku": "NS-0206-1",
        "name": "کیلو",
        "price": 3000000,
        "containerSize": "کیلو",
        "portalPrice": 3000000
      }
    ]
  },
  {
    "sourceRow": 218,
    "name": "سماق قرمز پودر",
    "slug": "red_sumac_powder",
    "variants": [
      {
        "sku": "NS-0207-1",
        "name": "کیلو",
        "price": 2400000,
        "containerSize": "کیلو",
        "portalPrice": 2400000
      }
    ]
  },
  {
    "sourceRow": 220,
    "name": "سماق قهوه ای پودر",
    "slug": "brown_sumac_powder",
    "variants": [
      {
        "sku": "NS-0208-1",
        "name": "کیلو",
        "price": 2150000,
        "containerSize": "کیلو",
        "portalPrice": 2150000
      }
    ]
  },
  {
    "sourceRow": 221,
    "name": "سماق ناساب",
    "slug": "whole_sumac",
    "variants": [
      {
        "sku": "NS-0209-1",
        "name": "کیلو",
        "price": 900000,
        "containerSize": "کیلو",
        "portalPrice": 900000
      }
    ]
  },
  {
    "sourceRow": 232,
    "name": "سیر سیاه",
    "slug": "black_garlic",
    "variants": [
      {
        "sku": "NS-0220-1",
        "name": "کیلو",
        "price": 800000,
        "containerSize": "کیلو",
        "portalPrice": 800000
      }
    ]
  },
  {
    "sourceRow": 233,
    "name": "سیر همدان",
    "slug": "garlic_hamedan",
    "variants": [
      {
        "sku": "NS-0221-1",
        "name": "کیلو",
        "price": 1100000,
        "containerSize": "کیلو",
        "portalPrice": 1100000
      }
    ]
  },
  {
    "sourceRow": 267,
    "name": "صابون زردچوبه",
    "slug": "soap_turmeric",
    "variants": [
      {
        "sku": "NS-0255-1",
        "name": "کیلو",
        "price": 120000,
        "containerSize": "کیلو",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 330,
    "name": "فلفل ترکی",
    "slug": "flfl_turkish",
    "variants": [
      {
        "sku": "NS-0316-1",
        "name": "کیلو",
        "price": 980000,
        "containerSize": "کیلو",
        "portalPrice": 980000
      }
    ]
  },
  {
    "sourceRow": 331,
    "name": "فلفل سیاه نکوبیده",
    "slug": "whole-black-pepper",
    "variants": [
      {
        "sku": "NS-0317-1",
        "name": "کیلو",
        "price": 2300000,
        "containerSize": "کیلو",
        "portalPrice": 2300000
      }
    ]
  },
  {
    "sourceRow": 332,
    "name": "فلفل قرمز ایرانی",
    "slug": "iranian-red-pepper",
    "variants": [
      {
        "sku": "NS-0318-1",
        "name": "کیلو",
        "price": 600000,
        "containerSize": "کیلو",
        "portalPrice": 600000
      }
    ]
  },
  {
    "sourceRow": 333,
    "name": "فلفل قرمز هندی",
    "slug": "indian-red-pepper",
    "variants": [
      {
        "sku": "NS-0319-1",
        "name": "کیلو",
        "price": 700000,
        "containerSize": "کیلو",
        "portalPrice": 700000
      }
    ]
  },
  {
    "sourceRow": 334,
    "name": "فلفل قرمز هندی تند",
    "slug": "hot_indian_red_pepper",
    "variants": [
      {
        "sku": "NS-0320-1",
        "name": "کیلو",
        "price": 900000,
        "containerSize": "کیلو",
        "portalPrice": 900000
      }
    ]
  },
  {
    "sourceRow": 385,
    "name": "موسیر",
    "slug": "mvsyr",
    "variants": [
      {
        "sku": "NS-0368-1",
        "name": "کیلو",
        "price": 3500000,
        "containerSize": "کیلو",
        "portalPrice": 3500000
      }
    ]
  },
  {
    "sourceRow": 386,
    "name": "میخک",
    "slug": "clove",
    "variants": [
      {
        "sku": "NS-0369-1",
        "name": "کیلو",
        "price": 3800000,
        "containerSize": "کیلو",
        "portalPrice": 3800000
      }
    ]
  },
  {
    "sourceRow": 391,
    "name": "نمک ارومیه",
    "slug": "urmia_salt",
    "variants": [
      {
        "sku": "NS-0374-1",
        "name": "بسته ای",
        "price": 120000,
        "containerSize": "بسته ای",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 392,
    "name": "نمک جهرم دل نمک",
    "slug": "salt_jhrm_dl_salt",
    "variants": [
      {
        "sku": "NS-0375-1",
        "name": "کیلو",
        "price": 220000,
        "containerSize": "کیلو",
        "portalPrice": 220000
      }
    ]
  },
  {
    "sourceRow": 393,
    "name": "نمک دریا",
    "slug": "sea_salt",
    "variants": [
      {
        "sku": "NS-0376-1",
        "name": "بسته ای",
        "price": 100000,
        "containerSize": "بسته ای",
        "portalPrice": 100000
      }
    ]
  },
  {
    "sourceRow": 394,
    "name": "نمک صورتی",
    "slug": "pink_salt",
    "variants": [
      {
        "sku": "NS-0377-1",
        "name": "کیلو",
        "price": 150000,
        "containerSize": "کیلو",
        "portalPrice": 150000
      }
    ]
  },
  {
    "sourceRow": 395,
    "name": "نمک صورتی سنگ",
    "slug": "pink_rock_salt",
    "variants": [
      {
        "sku": "NS-0378-1",
        "name": "کیلو",
        "price": 120000,
        "containerSize": "کیلو",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 397,
    "name": "نمک نارنجی",
    "slug": "salt_orange",
    "variants": [
      {
        "sku": "NS-0379-1",
        "name": "کیلو",
        "price": 150000,
        "containerSize": "کیلو",
        "portalPrice": 150000
      }
    ]
  },
  {
    "sourceRow": 404,
    "name": "هل باد",
    "slug": "cardamom_pods",
    "variants": [
      {
        "sku": "NS-0384-1",
        "name": "کیلو",
        "price": 3500000,
        "containerSize": "کیلو",
        "portalPrice": 3500000
      }
    ]
  },
  {
    "sourceRow": 405,
    "name": "هل پودر",
    "slug": "cardamom_powder",
    "variants": [
      {
        "sku": "NS-0385-1",
        "name": "کیلو",
        "price": 10000000,
        "containerSize": "کیلو",
        "portalPrice": 10000000
      }
    ]
  },
  {
    "sourceRow": 406,
    "name": "هل پیور اسپایس",
    "slug": "cardamom_pure_spice",
    "variants": [
      {
        "sku": "NS-0386-1",
        "name": "کیلو",
        "price": 12000000,
        "containerSize": "کیلو",
        "portalPrice": 12000000
      }
    ]
  },
  {
    "sourceRow": 407,
    "name": "هلیله سیاه",
    "slug": "chebulic_myrobalan_black",
    "variants": [
      {
        "sku": "NS-0387-1",
        "name": "کیلو",
        "price": 1500000,
        "containerSize": "کیلو",
        "portalPrice": 1500000
      }
    ]
  },
  {
    "sourceRow": 56,
    "name": "پاپریکا",
    "slug": "paprika",
    "variants": [
      {
        "sku": "NS-0052-1",
        "name": "کیلو",
        "price": 990000,
        "containerSize": "کیلو",
        "portalPrice": 990000
      }
    ]
  },
  {
    "sourceRow": 69,
    "name": "پیاز پودر",
    "slug": "onion_powder",
    "variants": [
      {
        "sku": "NS-0065-1",
        "name": "کیلو",
        "price": 700000,
        "containerSize": "کیلو",
        "portalPrice": 700000
      }
    ]
  },
  {
    "sourceRow": 368,
    "name": "گلپر",
    "slug": "golpar",
    "variants": [
      {
        "sku": "NS-0358-1",
        "name": "کیلو",
        "price": 450000,
        "containerSize": "کیلو",
        "portalPrice": 450000
      }
    ]
  },
  {
    "sourceRow": 35,
    "name": "اسپند نخودی",
    "slug": "espand_chickpea",
    "variants": [
      {
        "sku": "NS-0027-1",
        "name": "کیلو",
        "price": 180000,
        "containerSize": "کیلو",
        "portalPrice": 180000
      }
    ]
  },
  {
    "sourceRow": 49,
    "name": "باقلا خشک",
    "slug": "fava_bean_dried",
    "variants": [
      {
        "sku": "NS-0046-1",
        "name": "کیلو",
        "price": 140000,
        "containerSize": "کیلو",
        "portalPrice": 140000
      }
    ]
  },
  {
    "sourceRow": 85,
    "name": "جو دوسر پرک خارجی",
    "slug": "imported_rolled_oats",
    "variants": [
      {
        "sku": "NS-0078-1",
        "name": "کیلو",
        "price": 490000,
        "containerSize": "کیلو",
        "portalPrice": 490000
      }
    ]
  },
  {
    "sourceRow": 84,
    "name": "جوانه گندم",
    "slug": "wheat_germ_powder",
    "variants": [
      {
        "sku": "NS-0079-1",
        "name": "پودر",
        "price": 340000,
        "containerSize": "پودر",
        "portalPrice": 340000
      },
      {
        "sku": "NS-0079-2",
        "name": "تازه",
        "price": 100000,
        "containerSize": "تازه",
        "portalPrice": 100000
      }
    ]
  },
  {
    "sourceRow": 86,
    "name": "جوز هندی",
    "slug": "nutmeg_cashew",
    "variants": [
      {
        "sku": "NS-0080-1",
        "name": "کیلو",
        "price": 3800000,
        "containerSize": "کیلو",
        "portalPrice": 3800000
      }
    ]
  },
  {
    "sourceRow": 87,
    "name": "جوش شیرین",
    "slug": "baking-soda",
    "variants": [
      {
        "sku": "NS-0081-1",
        "name": "کیلو",
        "price": 150000,
        "containerSize": "کیلو",
        "portalPrice": 150000
      }
    ]
  },
  {
    "sourceRow": 89,
    "name": "جوهر لیمو",
    "slug": "citric_acid",
    "variants": [
      {
        "sku": "NS-0082-1",
        "name": "کیلو",
        "price": 580000,
        "containerSize": "کیلو",
        "portalPrice": 580000
      }
    ]
  },
  {
    "sourceRow": 227,
    "name": "سویق جوانه جو",
    "slug": "saviq_sprout_barley",
    "variants": [
      {
        "sku": "NS-0215-1",
        "name": "کیلو",
        "price": 500000,
        "containerSize": "کیلو",
        "portalPrice": 500000
      }
    ]
  },
  {
    "sourceRow": 228,
    "name": "سویق جوانه عدس",
    "slug": "saviq_sprout_lentil",
    "variants": [
      {
        "sku": "NS-0216-1",
        "name": "کیلو",
        "price": 450000,
        "containerSize": "کیلو",
        "portalPrice": 450000
      }
    ]
  },
  {
    "sourceRow": 230,
    "name": "سویق جوانه ماش",
    "slug": "saviq_sprout_mung",
    "variants": [
      {
        "sku": "NS-0218-1",
        "name": "کیلو",
        "price": 450000,
        "containerSize": "کیلو",
        "portalPrice": 450000
      }
    ]
  },
  {
    "sourceRow": 229,
    "name": "سویق جوانه گندم",
    "slug": "saviq_sprout_wheat",
    "variants": [
      {
        "sku": "NS-0217-1",
        "name": "کیلو",
        "price": 380000,
        "containerSize": "کیلو",
        "portalPrice": 380000
      }
    ]
  },
  {
    "sourceRow": 398,
    "name": "نمک نخودی (سنگ)",
    "slug": "salt_chickpea",
    "variants": [
      {
        "sku": "NS-0380-1",
        "name": "کیلو",
        "price": 50000,
        "containerSize": "کیلو",
        "portalPrice": 50000
      }
    ]
  },
  {
    "sourceRow": 365,
    "name": "کینوا سفید",
    "slug": "white_quinoa",
    "variants": [
      {
        "sku": "NS-0351-1",
        "name": "کیلو",
        "price": 640000,
        "containerSize": "کیلو",
        "portalPrice": 640000
      }
    ]
  },
  {
    "sourceRow": 374,
    "name": "گندم",
    "slug": "wheat",
    "variants": [
      {
        "sku": "NS-0360-1",
        "name": "کیلو",
        "price": 100000,
        "containerSize": "کیلو",
        "portalPrice": 100000
      }
    ]
  },
  {
    "sourceRow": 40,
    "name": "انجیر خشک",
    "slug": "dried_fig",
    "variants": [
      {
        "sku": "NS-0031-1",
        "name": "کیلو",
        "price": 600000,
        "containerSize": "کیلو",
        "portalPrice": 600000
      }
    ]
  },
  {
    "sourceRow": 44,
    "name": "بادام زمینی",
    "slug": "peanut",
    "variants": [
      {
        "sku": "NS-0041-1",
        "name": "کیلو",
        "price": 660000,
        "containerSize": "کیلو",
        "portalPrice": 660000
      }
    ]
  },
  {
    "sourceRow": 224,
    "name": "سنجد پودر",
    "slug": "oleaster_powder",
    "variants": [
      {
        "sku": "NS-0212-1",
        "name": "کیلو",
        "price": 650000,
        "containerSize": "کیلو",
        "portalPrice": 650000
      }
    ]
  },
  {
    "sourceRow": 225,
    "name": "سنجد پودر",
    "slug": "oleaster_powder",
    "variants": [
      {
        "sku": "NS-0213-1",
        "name": "کیلو",
        "price": 650000,
        "containerSize": "کیلو",
        "portalPrice": 650000
      }
    ]
  },
  {
    "sourceRow": 250,
    "name": "شیره انجیر",
    "slug": "fig_syrup",
    "variants": [
      {
        "sku": "NS-0238-1",
        "name": "500 گرم",
        "price": 250000,
        "containerSize": "500 گرم",
        "portalPrice": 250000
      }
    ]
  },
  {
    "sourceRow": 266,
    "name": "صابون زردآلو",
    "slug": "soap_apricot",
    "variants": [
      {
        "sku": "NS-0254-1",
        "name": "کیلو",
        "price": 120000,
        "containerSize": "کیلو",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 272,
    "name": "صابون فندق",
    "slug": "soap_hazelnut",
    "variants": [
      {
        "sku": "NS-0260-1",
        "name": "کیلو",
        "price": 120000,
        "containerSize": "کیلو",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 326,
    "name": "عناب",
    "slug": "jujube_bsth_zrgl",
    "variants": [
      {
        "sku": "NS-0312-1",
        "name": "بسته زرگل",
        "price": 250000,
        "containerSize": "بسته زرگل",
        "portalPrice": 250000
      },
      {
        "sku": "NS-0312-2",
        "name": "بسته طلا",
        "price": 280000,
        "containerSize": "بسته طلا",
        "portalPrice": 280000
      }
    ]
  },
  {
    "sourceRow": 327,
    "name": "عناب خشک",
    "slug": "jujube_dried_1",
    "variants": [
      {
        "sku": "NS-0313-1",
        "name": "کیلو",
        "price": 410000,
        "containerSize": "کیلو",
        "portalPrice": 410000
      },
      {
        "sku": "NS-0313-2",
        "name": "بسته",
        "price": 150000,
        "containerSize": "بسته",
        "portalPrice": 150000
      }
    ]
  },
  {
    "sourceRow": 343,
    "name": "کرم بادام زمینی",
    "slug": "peanut_cream",
    "variants": [
      {
        "sku": "NS-0329-1",
        "name": "کیلو",
        "price": 1100000,
        "containerSize": "کیلو",
        "portalPrice": 1100000
      }
    ]
  },
  {
    "sourceRow": 344,
    "name": "کرم کنجد",
    "slug": "sesame_cream",
    "variants": [
      {
        "sku": "NS-0330-1",
        "name": "200گرم",
        "price": 1300000,
        "containerSize": "200گرم",
        "portalPrice": 1300000
      },
      {
        "sku": "NS-NEW-0340-2",
        "name": "پیش‌فرض",
        "price": 290000,
        "containerSize": "",
        "portalPrice": 290000
      }
    ]
  },
  {
    "sourceRow": 345,
    "name": "کره بادام درختی",
    "slug": "almond_butter_180_warm",
    "variants": [
      {
        "sku": "NS-0331-1",
        "name": "215 گرم ظ",
        "price": 480000,
        "containerSize": "215 گرم ظ",
        "portalPrice": 480000
      },
      {
        "sku": "NS-0331-2",
        "name": "کیلو",
        "price": 2250000,
        "containerSize": "کیلو",
        "portalPrice": 2250000
      }
    ]
  },
  {
    "sourceRow": 346,
    "name": "کره بادام زمینی",
    "slug": "peanut_butter",
    "variants": [
      {
        "sku": "NS-0332-1",
        "name": "کیلو",
        "price": 690000,
        "containerSize": "کیلو",
        "portalPrice": 690000
      }
    ]
  },
  {
    "sourceRow": 351,
    "name": "کره فندق",
    "slug": "hazelnut_butter",
    "variants": [
      {
        "sku": "NS-0337-1",
        "name": "195 گرم",
        "price": 500000,
        "containerSize": "195 گرم",
        "portalPrice": 500000
      }
    ]
  },
  {
    "sourceRow": 349,
    "name": "کره پسته",
    "slug": "pistachio_butter_180_warm",
    "variants": [
      {
        "sku": "NS-0335-1",
        "name": "180 گرم",
        "price": 810000,
        "containerSize": "180 گرم",
        "portalPrice": 810000
      },
      {
        "sku": "NS-0335-2",
        "name": "کیلو",
        "price": 4500000,
        "containerSize": "کیلو",
        "portalPrice": 4500000
      }
    ]
  },
  {
    "sourceRow": 354,
    "name": "کشمش با هسته (مویز)",
    "slug": "raisin_with_seed",
    "variants": [
      {
        "sku": "NS-0340-1",
        "name": "کیلو",
        "price": 800000,
        "containerSize": "کیلو",
        "portalPrice": 800000
      }
    ]
  },
  {
    "sourceRow": 355,
    "name": "کشمش سبز",
    "slug": "green_raisin",
    "variants": [
      {
        "sku": "NS-0341-1",
        "name": "کیلو",
        "price": 700000,
        "containerSize": "کیلو",
        "portalPrice": 700000
      }
    ]
  },
  {
    "sourceRow": 361,
    "name": "کنجد سفید",
    "slug": "white_sesame",
    "variants": [
      {
        "sku": "NS-0347-1",
        "name": "کیلو",
        "price": 700000,
        "containerSize": "کیلو",
        "portalPrice": 700000
      }
    ]
  },
  {
    "sourceRow": 362,
    "name": "کنجد قهوه ای",
    "slug": "brown_sesame",
    "variants": [
      {
        "sku": "NS-0348-1",
        "name": "کیلو",
        "price": 600000,
        "containerSize": "کیلو",
        "portalPrice": 600000
      }
    ]
  },
  {
    "sourceRow": 110,
    "name": "حلوا روغنی",
    "slug": "halva_oily",
    "variants": [
      {
        "sku": "NS-0103-1",
        "name": "کیلو",
        "price": 350000,
        "containerSize": "کیلو",
        "portalPrice": 350000
      }
    ]
  },
  {
    "sourceRow": 129,
    "name": "روغن آرگان درجه 1",
    "slug": "oil_argan_grade_1_30ml",
    "variants": [
      {
        "sku": "NS-0125-1",
        "name": "30میل",
        "price": 300000,
        "containerSize": "30میل",
        "portalPrice": 300000
      },
      {
        "sku": "NS-0125-2",
        "name": "60میل",
        "price": 590000,
        "containerSize": "60میل",
        "portalPrice": 590000
      }
    ]
  },
  {
    "sourceRow": 130,
    "name": "روغن آرگان درجه 2",
    "slug": "oil_argan_grade_2_30ml",
    "variants": [
      {
        "sku": "NS-0126-1",
        "name": "30میل",
        "price": 190000,
        "containerSize": "30میل",
        "portalPrice": 190000
      },
      {
        "sku": "NS-0126-2",
        "name": "60میل",
        "price": 370000,
        "containerSize": "60میل",
        "portalPrice": 370000
      }
    ]
  },
  {
    "sourceRow": 131,
    "name": "روغن آرگان مراکش درجه 1",
    "slug": "oil_argan_moroccan_grade_1_half_liter",
    "variants": [
      {
        "sku": "NS-0127-1",
        "name": "نیم لیتر",
        "price": 3750000,
        "containerSize": "نیم لیتر",
        "portalPrice": 3750000
      },
      {
        "sku": "NS-0127-2",
        "name": "1لیتر",
        "price": 7500000,
        "containerSize": "1لیتر",
        "portalPrice": 7500000
      }
    ]
  },
  {
    "sourceRow": 132,
    "name": "روغن آرگان مراکش درجه 2",
    "slug": "oil_argan_moroccan_grade_2_half_liter",
    "variants": [
      {
        "sku": "NS-0128-1",
        "name": "نیم لیتر",
        "price": 2250000,
        "containerSize": "نیم لیتر",
        "portalPrice": 2250000
      },
      {
        "sku": "NS-0128-2",
        "name": "1لیتر",
        "price": 4500000,
        "containerSize": "1لیتر",
        "portalPrice": 4500000
      }
    ]
  },
  {
    "sourceRow": 134,
    "name": "روغن آفتابگردان",
    "slug": "oil_sunflower_half_liter",
    "variants": [
      {
        "sku": "NS-0129-1",
        "name": "نیم لیتر",
        "price": 480000,
        "containerSize": "نیم لیتر",
        "portalPrice": 480000
      },
      {
        "sku": "NS-0129-2",
        "name": "1لیتر",
        "price": 950000,
        "containerSize": "1لیتر",
        "portalPrice": 950000
      }
    ]
  },
  {
    "sourceRow": 137,
    "name": "روغن آمله",
    "slug": "oil_amla_30ml",
    "variants": [
      {
        "sku": "NS-0130-1",
        "name": "30میل",
        "price": 80000,
        "containerSize": "30میل",
        "portalPrice": 80000
      },
      {
        "sku": "NS-0130-2",
        "name": "60میل",
        "price": 150000,
        "containerSize": "60میل",
        "portalPrice": 150000
      }
    ]
  },
  {
    "sourceRow": 139,
    "name": "روغن آووکادو",
    "slug": "oil_avocado_30ml",
    "variants": [
      {
        "sku": "NS-0131-1",
        "name": "30میل",
        "price": 100000,
        "containerSize": "30میل",
        "portalPrice": 100000
      },
      {
        "sku": "NS-0131-2",
        "name": "60میل",
        "price": 190000,
        "containerSize": "60میل",
        "portalPrice": 190000
      }
    ]
  },
  {
    "sourceRow": 128,
    "name": "روغن ارده",
    "slug": "oil_tahini_half_liter",
    "variants": [
      {
        "sku": "NS-0120-1",
        "name": "نیم لیتر",
        "price": 555000,
        "containerSize": "نیم لیتر",
        "portalPrice": 555000
      },
      {
        "sku": "NS-0120-2",
        "name": "1لیتر",
        "price": 1100000,
        "containerSize": "1لیتر",
        "portalPrice": 1100000
      }
    ]
  },
  {
    "sourceRow": 133,
    "name": "روغن اسطوخودوس",
    "slug": "oil_lavender_30ml",
    "variants": [
      {
        "sku": "NS-0121-1",
        "name": "30میل",
        "price": 80000,
        "containerSize": "30میل",
        "portalPrice": 80000
      },
      {
        "sku": "NS-0121-2",
        "name": "60میل",
        "price": 150000,
        "containerSize": "60میل",
        "portalPrice": 150000
      }
    ]
  },
  {
    "sourceRow": 136,
    "name": "روغن الاغ",
    "slug": "oil_donkey_30ml",
    "variants": [
      {
        "sku": "NS-0123-1",
        "name": "30میل",
        "price": 80000,
        "containerSize": "30میل",
        "portalPrice": 80000
      },
      {
        "sku": "NS-0123-2",
        "name": "60میل",
        "price": 150000,
        "containerSize": "60میل",
        "portalPrice": 150000
      }
    ]
  },
  {
    "sourceRow": 138,
    "name": "روغن انار",
    "slug": "oil_pomegranate_30ml",
    "variants": [
      {
        "sku": "NS-0124-1",
        "name": "30میل",
        "price": 80000,
        "containerSize": "30میل",
        "portalPrice": 80000
      },
      {
        "sku": "NS-0124-2",
        "name": "60میل",
        "price": 150000,
        "containerSize": "60میل",
        "portalPrice": 150000
      }
    ]
  },
  {
    "sourceRow": 135,
    "name": "روغن اکالیپتوس",
    "slug": "oil_eucalyptus_30ml",
    "variants": [
      {
        "sku": "NS-0122-1",
        "name": "30میل",
        "price": 65000,
        "containerSize": "30میل",
        "portalPrice": 65000
      },
      {
        "sku": "NS-0122-2",
        "name": "60میل",
        "price": 120000,
        "containerSize": "60میل",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 140,
    "name": "روغن بابونه",
    "slug": "oil_chamomile_30ml",
    "variants": [
      {
        "sku": "NS-0132-1",
        "name": "30میل",
        "price": 100000,
        "containerSize": "30میل",
        "portalPrice": 100000
      },
      {
        "sku": "NS-0132-2",
        "name": "60میل",
        "price": 195000,
        "containerSize": "60میل",
        "portalPrice": 195000
      }
    ]
  },
  {
    "sourceRow": 141,
    "name": "روغن بادام تلخ",
    "slug": "bitter_almond_oil_30ml",
    "variants": [
      {
        "sku": "NS-0133-1",
        "name": "30میل",
        "price": 95000,
        "containerSize": "30میل",
        "portalPrice": 95000
      },
      {
        "sku": "NS-0134-1",
        "name": "60میل",
        "price": 180000,
        "containerSize": "60میل",
        "portalPrice": 180000
      }
    ]
  },
  {
    "sourceRow": 142,
    "name": "روغن بادام تلخ",
    "slug": "bitter_almond_oil_60ml",
    "variants": [
      {
        "sku": "NS-0133-2",
        "name": "نیم لیتر",
        "price": 1300000,
        "containerSize": "نیم لیتر",
        "portalPrice": 1300000
      },
      {
        "sku": "NS-0134-2",
        "name": "1لیتر",
        "price": 2600000,
        "containerSize": "1لیتر",
        "portalPrice": 2600000
      },
      {
        "sku": "NS-0140-1",
        "name": "کیلو",
        "price": 350000,
        "containerSize": "کیلو",
        "portalPrice": 350000
      }
    ]
  },
  {
    "sourceRow": 143,
    "name": "روغن بادام شیرین",
    "slug": "sweet_almond_oil_half_liter",
    "variants": [
      {
        "sku": "NS-0135-1",
        "name": "نیم لیتر",
        "price": 1550000,
        "containerSize": "نیم لیتر",
        "portalPrice": 1550000
      },
      {
        "sku": "NS-0136-1",
        "name": "1لیتر",
        "price": 3100000,
        "containerSize": "1لیتر",
        "portalPrice": 3100000
      }
    ]
  },
  {
    "sourceRow": 144,
    "name": "روغن بادام شیرین",
    "slug": "sweet_almond_oil_1_liter",
    "variants": [
      {
        "sku": "NS-0135-2",
        "name": "30میل",
        "price": 100000,
        "containerSize": "30میل",
        "portalPrice": 100000
      },
      {
        "sku": "NS-0136-2",
        "name": "60میل",
        "price": 195000,
        "containerSize": "60میل",
        "portalPrice": 195000
      }
    ]
  },
  {
    "sourceRow": 145,
    "name": "روغن بنفشه",
    "slug": "oil_violet_30ml",
    "variants": [
      {
        "sku": "NS-0137-1",
        "name": "30میل",
        "price": 135000,
        "containerSize": "30میل",
        "portalPrice": 135000
      },
      {
        "sku": "NS-0137-2",
        "name": "60میل",
        "price": 260000,
        "containerSize": "60میل",
        "portalPrice": 260000
      }
    ]
  },
  {
    "sourceRow": 147,
    "name": "روغن ترخون",
    "slug": "oil_tarragon_30ml",
    "variants": [
      {
        "sku": "NS-0139-1",
        "name": "30میل",
        "price": 65000,
        "containerSize": "30میل",
        "portalPrice": 65000
      },
      {
        "sku": "NS-0139-2",
        "name": "60میل",
        "price": 120000,
        "containerSize": "60میل",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 149,
    "name": "روغن جوانه گندم",
    "slug": "oil_sprout_wheat_30ml",
    "variants": [
      {
        "sku": "NS-0141-1",
        "name": "30میل",
        "price": 90000,
        "containerSize": "30میل",
        "portalPrice": 90000
      },
      {
        "sku": "NS-0141-2",
        "name": "60میل",
        "price": 170000,
        "containerSize": "60میل",
        "portalPrice": 170000
      }
    ]
  },
  {
    "sourceRow": 150,
    "name": "روغن جوجوبا",
    "slug": "oil_jojoba_30ml",
    "variants": [
      {
        "sku": "NS-0142-1",
        "name": "30میل",
        "price": 100000,
        "containerSize": "30میل",
        "portalPrice": 100000
      },
      {
        "sku": "NS-0142-2",
        "name": "60میل",
        "price": 190000,
        "containerSize": "60میل",
        "portalPrice": 190000
      }
    ]
  },
  {
    "sourceRow": 151,
    "name": "روغن حنظل",
    "slug": "oil_colocynth_30ml",
    "variants": [
      {
        "sku": "NS-0143-1",
        "name": "30میل",
        "price": 65000,
        "containerSize": "30میل",
        "portalPrice": 65000
      },
      {
        "sku": "NS-0143-2",
        "name": "60میل",
        "price": 120000,
        "containerSize": "60میل",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 152,
    "name": "روغن خارمریم",
    "slug": "oil_milk_thistle_30ml",
    "variants": [
      {
        "sku": "NS-0144-1",
        "name": "30میل",
        "price": 115000,
        "containerSize": "30میل",
        "portalPrice": 115000
      },
      {
        "sku": "NS-0144-2",
        "name": "60میل",
        "price": 220000,
        "containerSize": "60میل",
        "portalPrice": 220000
      }
    ]
  },
  {
    "sourceRow": 153,
    "name": "روغن خراطین",
    "slug": "oil_kharatin_30ml",
    "variants": [
      {
        "sku": "NS-0145-1",
        "name": "30میل",
        "price": 135000,
        "containerSize": "30میل",
        "portalPrice": 135000
      },
      {
        "sku": "NS-0145-2",
        "name": "60میل",
        "price": 260000,
        "containerSize": "60میل",
        "portalPrice": 260000
      }
    ]
  },
  {
    "sourceRow": 154,
    "name": "روغن خشخاش",
    "slug": "oil_poppy_30ml",
    "variants": [
      {
        "sku": "NS-0146-1",
        "name": "30میل",
        "price": 115000,
        "containerSize": "30میل",
        "portalPrice": 115000
      },
      {
        "sku": "NS-0146-2",
        "name": "60میل",
        "price": 220000,
        "containerSize": "60میل",
        "portalPrice": 220000
      }
    ]
  },
  {
    "sourceRow": 155,
    "name": "روغن درخت چای",
    "slug": "tea_tree_oil_30ml",
    "variants": [
      {
        "sku": "NS-0147-1",
        "name": "30میل",
        "price": 100000,
        "containerSize": "30میل",
        "portalPrice": 100000
      },
      {
        "sku": "NS-0147-2",
        "name": "60میل",
        "price": 195000,
        "containerSize": "60میل",
        "portalPrice": 195000
      }
    ]
  },
  {
    "sourceRow": 156,
    "name": "روغن درمنه",
    "slug": "oil_wormwood_30ml",
    "variants": [
      {
        "sku": "NS-0148-1",
        "name": "30میل",
        "price": 95000,
        "containerSize": "30میل",
        "portalPrice": 95000
      },
      {
        "sku": "NS-0148-2",
        "name": "60میل",
        "price": 185000,
        "containerSize": "60میل",
        "portalPrice": 185000
      }
    ]
  },
  {
    "sourceRow": 157,
    "name": "روغن رازیانه",
    "slug": "oil_fennel_30ml",
    "variants": [
      {
        "sku": "NS-0149-1",
        "name": "30میل",
        "price": 115000,
        "containerSize": "30میل",
        "portalPrice": 115000
      },
      {
        "sku": "NS-0149-2",
        "name": "60میل",
        "price": 220000,
        "containerSize": "60میل",
        "portalPrice": 220000
      }
    ]
  },
  {
    "sourceRow": 158,
    "name": "روغن رزماری",
    "slug": "oil_rosemary_half_liter",
    "variants": [
      {
        "sku": "NS-0150-1",
        "name": "نیم لیتر",
        "price": 500000,
        "containerSize": "نیم لیتر",
        "portalPrice": 500000
      },
      {
        "sku": "NS-0151-1",
        "name": "1لیتر",
        "price": 1000000,
        "containerSize": "1لیتر",
        "portalPrice": 1000000
      }
    ]
  },
  {
    "sourceRow": 159,
    "name": "روغن رزماری",
    "slug": "oil_rosemary_1_liter",
    "variants": [
      {
        "sku": "NS-0150-2",
        "name": "30میل",
        "price": 100000,
        "containerSize": "30میل",
        "portalPrice": 100000
      },
      {
        "sku": "NS-0151-2",
        "name": "60میل",
        "price": 195000,
        "containerSize": "60میل",
        "portalPrice": 195000
      }
    ]
  },
  {
    "sourceRow": 160,
    "name": "روغن زردچوبه",
    "slug": "oil_turmeric_30ml",
    "variants": [
      {
        "sku": "NS-0152-1",
        "name": "30میل",
        "price": 65000,
        "containerSize": "30میل",
        "portalPrice": 65000
      },
      {
        "sku": "NS-0152-2",
        "name": "60میل",
        "price": 120000,
        "containerSize": "60میل",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 161,
    "name": "روغن زنجبیل",
    "slug": "oil_ginger_30ml",
    "variants": [
      {
        "sku": "NS-0153-1",
        "name": "30میل",
        "price": 65000,
        "containerSize": "30میل",
        "portalPrice": 65000
      },
      {
        "sku": "NS-0153-2",
        "name": "60میل",
        "price": 120000,
        "containerSize": "60میل",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 162,
    "name": "روغن زنیان",
    "slug": "oil_ajwain_30ml",
    "variants": [
      {
        "sku": "NS-0154-1",
        "name": "30میل",
        "price": 150000,
        "containerSize": "30میل",
        "portalPrice": 150000
      },
      {
        "sku": "NS-0154-2",
        "name": "60میل",
        "price": 295000,
        "containerSize": "60میل",
        "portalPrice": 295000
      }
    ]
  },
  {
    "sourceRow": 163,
    "name": "روغن زیتون",
    "slug": "oil_olive_half_liter",
    "variants": [
      {
        "sku": "NS-0155-1",
        "name": "نیم لیتر",
        "price": 655000,
        "containerSize": "نیم لیتر",
        "portalPrice": 655000
      },
      {
        "sku": "NS-0155-2",
        "name": "1لیتر",
        "price": 1300000,
        "containerSize": "1لیتر",
        "portalPrice": 1300000
      }
    ]
  },
  {
    "sourceRow": 164,
    "name": "روغن زیتون موضعی",
    "slug": "topical_olive_oil_60ml",
    "variants": [
      {
        "sku": "NS-0156-2",
        "name": "60میل",
        "price": 70000,
        "containerSize": "60میل",
        "portalPrice": 70000
      }
    ]
  },
  {
    "sourceRow": 165,
    "name": "روغن سقز",
    "slug": "oil_mastic_30ml",
    "variants": [
      {
        "sku": "NS-0157-1",
        "name": "30میل",
        "price": 90000,
        "containerSize": "30میل",
        "portalPrice": 90000
      },
      {
        "sku": "NS-0157-2",
        "name": "60میل",
        "price": 170000,
        "containerSize": "60میل",
        "portalPrice": 170000
      }
    ]
  },
  {
    "sourceRow": 166,
    "name": "روغن سیاهدانه",
    "slug": "oil_syahdanh_30ml",
    "variants": [
      {
        "sku": "NS-0158-1",
        "name": "30میل",
        "price": 130000,
        "containerSize": "30میل",
        "portalPrice": 130000
      },
      {
        "sku": "NS-0158-2",
        "name": "60میل",
        "price": 255000,
        "containerSize": "60میل",
        "portalPrice": 255000
      }
    ]
  },
  {
    "sourceRow": 167,
    "name": "روغن سیاهدانه هندی",
    "slug": "indian_black_seed_oil_half_liter",
    "variants": [
      {
        "sku": "NS-0159-1",
        "name": "نیم لیتر",
        "price": 1760000,
        "containerSize": "نیم لیتر",
        "portalPrice": 1760000
      },
      {
        "sku": "NS-0159-2",
        "name": "1لیتر",
        "price": 3500000,
        "containerSize": "1لیتر",
        "portalPrice": 3500000
      }
    ]
  },
  {
    "sourceRow": 168,
    "name": "روغن سیر",
    "slug": "oil_garlic_30ml",
    "variants": [
      {
        "sku": "NS-0160-1",
        "name": "30میل",
        "price": 65000,
        "containerSize": "30میل",
        "portalPrice": 65000
      },
      {
        "sku": "NS-0160-2",
        "name": "60میل",
        "price": 120000,
        "containerSize": "60میل",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 169,
    "name": "روغن شترمرغ",
    "slug": "oil_ostrich_30ml",
    "variants": [
      {
        "sku": "NS-0161-1",
        "name": "30میل",
        "price": 90000,
        "containerSize": "30میل",
        "portalPrice": 90000
      },
      {
        "sku": "NS-0161-2",
        "name": "60میل",
        "price": 170000,
        "containerSize": "60میل",
        "portalPrice": 170000
      }
    ]
  },
  {
    "sourceRow": 170,
    "name": "روغن شوید",
    "slug": "oil_dill_30ml",
    "variants": [
      {
        "sku": "NS-0162-1",
        "name": "30میل",
        "price": 65000,
        "containerSize": "30میل",
        "portalPrice": 65000
      },
      {
        "sku": "NS-0162-2",
        "name": "60میل",
        "price": 120000,
        "containerSize": "60میل",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 171,
    "name": "روغن شی باتر",
    "slug": "shea_butter_oil_90_warm",
    "variants": [
      {
        "sku": "NS-0163-1",
        "name": "90 گرم",
        "price": 145000,
        "containerSize": "90 گرم",
        "portalPrice": 145000
      },
      {
        "sku": "NS-0163-2",
        "name": "کیلو",
        "price": 1500000,
        "containerSize": "کیلو",
        "portalPrice": 1500000
      }
    ]
  },
  {
    "sourceRow": 172,
    "name": "روغن ضد التهاب",
    "slug": "anti_inflammatory_oil_30ml",
    "variants": [
      {
        "sku": "NS-0164-1",
        "name": "30میل",
        "price": 120000,
        "containerSize": "30میل",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 173,
    "name": "روغن ضد درد",
    "slug": "pain_relief_oil_half_liter",
    "variants": [
      {
        "sku": "NS-0165-1",
        "name": "نیم لیتر",
        "price": 1475000,
        "containerSize": "نیم لیتر",
        "portalPrice": 1475000
      },
      {
        "sku": "NS-0166-1",
        "name": "1لیتر",
        "price": 2950000,
        "containerSize": "1لیتر",
        "portalPrice": 2950000
      }
    ]
  },
  {
    "sourceRow": 174,
    "name": "روغن ضد درد",
    "slug": "pain_relief_oil_1_liter",
    "variants": [
      {
        "sku": "NS-0165-2",
        "name": "30میل",
        "price": 100000,
        "containerSize": "30میل",
        "portalPrice": 100000
      },
      {
        "sku": "NS-0166-2",
        "name": "60میل",
        "price": 195000,
        "containerSize": "60میل",
        "portalPrice": 195000
      }
    ]
  },
  {
    "sourceRow": 175,
    "name": "روغن فندق",
    "slug": "oil_hazelnut_30ml",
    "variants": [
      {
        "sku": "NS-0167-1",
        "name": "30میل",
        "price": 100000,
        "containerSize": "30میل",
        "portalPrice": 100000
      },
      {
        "sku": "NS-0167-2",
        "name": "60میل",
        "price": 195000,
        "containerSize": "60میل",
        "portalPrice": 195000
      }
    ]
  },
  {
    "sourceRow": 190,
    "name": "روغن لیمو",
    "slug": "oil_lemon_30ml",
    "variants": [
      {
        "sku": "NS-0182-1",
        "name": "30میل",
        "price": 90000,
        "containerSize": "30میل",
        "portalPrice": 90000
      },
      {
        "sku": "NS-0182-2",
        "name": "60میل",
        "price": 170000,
        "containerSize": "60میل",
        "portalPrice": 170000
      }
    ]
  },
  {
    "sourceRow": 191,
    "name": "روغن ماکادمیا",
    "slug": "oil_macadamia_30ml",
    "variants": [
      {
        "sku": "NS-0183-1",
        "name": "30میل",
        "price": 100000,
        "containerSize": "30میل",
        "portalPrice": 100000
      },
      {
        "sku": "NS-0183-2",
        "name": "60میل",
        "price": 190000,
        "containerSize": "60میل",
        "portalPrice": 190000
      }
    ]
  },
  {
    "sourceRow": 192,
    "name": "روغن مورد",
    "slug": "oil_myrtle_30ml",
    "variants": [
      {
        "sku": "NS-0184-1",
        "name": "30میل",
        "price": 90000,
        "containerSize": "30میل",
        "portalPrice": 90000
      },
      {
        "sku": "NS-0184-2",
        "name": "60میل",
        "price": 170000,
        "containerSize": "60میل",
        "portalPrice": 170000
      }
    ]
  },
  {
    "sourceRow": 193,
    "name": "روغن مورینگا",
    "slug": "oil_moringa_30ml",
    "variants": [
      {
        "sku": "NS-0185-1",
        "name": "30میل",
        "price": 125000,
        "containerSize": "30میل",
        "portalPrice": 125000
      },
      {
        "sku": "NS-0185-2",
        "name": "60میل",
        "price": 245000,
        "containerSize": "60میل",
        "portalPrice": 245000
      }
    ]
  },
  {
    "sourceRow": 194,
    "name": "روغن میخک",
    "slug": "oil_clove_30ml",
    "variants": [
      {
        "sku": "NS-0186-1",
        "name": "30میل",
        "price": 90000,
        "containerSize": "30میل",
        "portalPrice": 90000
      },
      {
        "sku": "NS-0186-2",
        "name": "60میل",
        "price": 170000,
        "containerSize": "60میل",
        "portalPrice": 170000
      }
    ]
  },
  {
    "sourceRow": 195,
    "name": "روغن نارگیل",
    "slug": "oil_coconut_half_liter",
    "variants": [
      {
        "sku": "NS-0187-1",
        "name": "نیم لیتر",
        "price": 1100000,
        "containerSize": "نیم لیتر",
        "portalPrice": 1100000
      },
      {
        "sku": "NS-0188-1",
        "name": "1لیتر",
        "price": 2200000,
        "containerSize": "1لیتر",
        "portalPrice": 2200000
      }
    ]
  },
  {
    "sourceRow": 196,
    "name": "روغن نارگیل",
    "slug": "oil_coconut_1_liter",
    "variants": [
      {
        "sku": "NS-0187-2",
        "name": "30میل",
        "price": 90000,
        "containerSize": "30میل",
        "portalPrice": 90000
      },
      {
        "sku": "NS-0188-2",
        "name": "60میل",
        "price": 170000,
        "containerSize": "60میل",
        "portalPrice": 170000
      }
    ]
  },
  {
    "sourceRow": 197,
    "name": "روغن هسته انگور",
    "slug": "grape_seed_oil_30ml",
    "variants": [
      {
        "sku": "NS-0189-1",
        "name": "30میل",
        "price": 65000,
        "containerSize": "30میل",
        "portalPrice": 65000
      },
      {
        "sku": "NS-0189-2",
        "name": "60میل",
        "price": 120000,
        "containerSize": "60میل",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 198,
    "name": "روغن هسته نارنج",
    "slug": "bitter_orange_seed_oil_30ml",
    "variants": [
      {
        "sku": "NS-0190-1",
        "name": "30 میل",
        "price": 65000,
        "containerSize": "30 میل",
        "portalPrice": 65000
      }
    ]
  },
  {
    "sourceRow": 146,
    "name": "روغن پونه",
    "slug": "oil_pennyroyal_30ml",
    "variants": [
      {
        "sku": "NS-0138-1",
        "name": "30میل",
        "price": 65000,
        "containerSize": "30میل",
        "portalPrice": 65000
      },
      {
        "sku": "NS-0138-2",
        "name": "60میل",
        "price": 120000,
        "containerSize": "60میل",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 176,
    "name": "روغن کدو",
    "slug": "oil_pumpkin_30ml",
    "variants": [
      {
        "sku": "NS-0168-1",
        "name": "30میل",
        "price": 90000,
        "containerSize": "30میل",
        "portalPrice": 90000
      },
      {
        "sku": "NS-0168-2",
        "name": "60میل",
        "price": 170000,
        "containerSize": "60میل",
        "portalPrice": 170000
      }
    ]
  },
  {
    "sourceRow": 177,
    "name": "روغن کرچک",
    "slug": "oil_castor_half_liter",
    "variants": [
      {
        "sku": "NS-0169-1",
        "name": "نیم لیتر",
        "price": 500000,
        "containerSize": "نیم لیتر",
        "portalPrice": 500000
      },
      {
        "sku": "NS-0170-1",
        "name": "1لیتر",
        "price": 1000000,
        "containerSize": "1لیتر",
        "portalPrice": 1000000
      }
    ]
  },
  {
    "sourceRow": 178,
    "name": "روغن کرچک",
    "slug": "oil_castor_1_liter",
    "variants": [
      {
        "sku": "NS-0169-2",
        "name": "30میل",
        "price": 65000,
        "containerSize": "30میل",
        "portalPrice": 65000
      },
      {
        "sku": "NS-0170-2",
        "name": "60میل",
        "price": 120000,
        "containerSize": "60میل",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 179,
    "name": "روغن کلزا",
    "slug": "oil_canola_half_liter",
    "variants": [
      {
        "sku": "NS-0171-1",
        "name": "نیم لیتر",
        "price": 480000,
        "containerSize": "نیم لیتر",
        "portalPrice": 480000
      },
      {
        "sku": "NS-0171-2",
        "name": "1لیتر",
        "price": 950000,
        "containerSize": "1لیتر",
        "portalPrice": 950000
      }
    ]
  },
  {
    "sourceRow": 180,
    "name": "روغن کنجد",
    "slug": "oil_sesame_half_liter",
    "variants": [
      {
        "sku": "NS-0172-1",
        "name": "نیم لیتر",
        "price": 655000,
        "containerSize": "نیم لیتر",
        "portalPrice": 655000
      },
      {
        "sku": "NS-0172-2",
        "name": "1لیتر",
        "price": 1300000,
        "containerSize": "1لیتر",
        "portalPrice": 1300000
      }
    ]
  },
  {
    "sourceRow": 182,
    "name": "روغن کنجد موضعی",
    "slug": "oil_sesame_topical_30ml",
    "variants": [
      {
        "sku": "NS-0174-1",
        "name": "30میل",
        "price": 45000,
        "containerSize": "30میل",
        "portalPrice": 45000
      },
      {
        "sku": "NS-0174-2",
        "name": "60میل",
        "price": 80000,
        "containerSize": "60میل",
        "portalPrice": 80000
      }
    ]
  },
  {
    "sourceRow": 183,
    "name": "روغن کندر",
    "slug": "oil_frankincense_30ml",
    "variants": [
      {
        "sku": "NS-0175-1",
        "name": "30میل",
        "price": 85000,
        "containerSize": "30میل",
        "portalPrice": 85000
      },
      {
        "sku": "NS-0175-2",
        "name": "60میل",
        "price": 160000,
        "containerSize": "60میل",
        "portalPrice": 160000
      }
    ]
  },
  {
    "sourceRow": 184,
    "name": "روغن کندش",
    "slug": "oil_kondosh_30ml",
    "variants": [
      {
        "sku": "NS-0176-1",
        "name": "30میل",
        "price": 125000,
        "containerSize": "30میل",
        "portalPrice": 125000
      },
      {
        "sku": "NS-0176-2",
        "name": "60میل",
        "price": 245000,
        "containerSize": "60میل",
        "portalPrice": 245000
      }
    ]
  },
  {
    "sourceRow": 185,
    "name": "روغن کوسه",
    "slug": "oil_shark_30ml",
    "variants": [
      {
        "sku": "NS-0177-1",
        "name": "30میل",
        "price": 90000,
        "containerSize": "30میل",
        "portalPrice": 90000
      },
      {
        "sku": "NS-0177-2",
        "name": "60میل",
        "price": 170000,
        "containerSize": "60میل",
        "portalPrice": 170000
      }
    ]
  },
  {
    "sourceRow": 186,
    "name": "روغن کوهان شتر",
    "slug": "oil_hump_camel_30ml",
    "variants": [
      {
        "sku": "NS-0178-1",
        "name": "30میل",
        "price": 90000,
        "containerSize": "30میل",
        "portalPrice": 90000
      },
      {
        "sku": "NS-0178-2",
        "name": "60میل",
        "price": 170000,
        "containerSize": "60میل",
        "portalPrice": 170000
      }
    ]
  },
  {
    "sourceRow": 187,
    "name": "روغن گردو",
    "slug": "oil_walnut_30ml",
    "variants": [
      {
        "sku": "NS-0179-1",
        "name": "30میل",
        "price": 115000,
        "containerSize": "30میل",
        "portalPrice": 115000
      },
      {
        "sku": "NS-0179-2",
        "name": "60میل",
        "price": 220000,
        "containerSize": "60میل",
        "portalPrice": 220000
      }
    ]
  },
  {
    "sourceRow": 188,
    "name": "روغن گل سرخ",
    "slug": "oil_flower_rose_30ml",
    "variants": [
      {
        "sku": "NS-0180-1",
        "name": "30میل",
        "price": 90000,
        "containerSize": "30میل",
        "portalPrice": 90000
      },
      {
        "sku": "NS-0180-2",
        "name": "60میل",
        "price": 170000,
        "containerSize": "60میل",
        "portalPrice": 170000
      }
    ]
  },
  {
    "sourceRow": 189,
    "name": "روغن گلیسیرین",
    "slug": "oil_glycerin_30ml",
    "variants": [
      {
        "sku": "NS-0181-1",
        "name": "30میل",
        "price": 75000,
        "containerSize": "30میل",
        "portalPrice": 75000
      },
      {
        "sku": "NS-0181-2",
        "name": "60میل",
        "price": 140000,
        "containerSize": "60میل",
        "portalPrice": 140000
      }
    ]
  },
  {
    "sourceRow": 39,
    "name": "انبه پودر",
    "slug": "mango_powder",
    "variants": [
      {
        "sku": "NS-0030-1",
        "name": "کیلو",
        "price": 1100000,
        "containerSize": "کیلو",
        "portalPrice": 1100000
      }
    ]
  },
  {
    "sourceRow": 50,
    "name": "بامیه پودر",
    "slug": "okra_powder",
    "variants": [
      {
        "sku": "NS-0047-1",
        "name": "کیلو",
        "price": 1100000,
        "containerSize": "کیلو",
        "portalPrice": 1100000
      }
    ]
  },
  {
    "sourceRow": 53,
    "name": "بلوط",
    "slug": "acorn",
    "variants": [
      {
        "sku": "NS-0050-1",
        "name": "کیلو",
        "price": 800000,
        "containerSize": "کیلو",
        "portalPrice": 800000
      }
    ]
  },
  {
    "sourceRow": 70,
    "name": "تخم ریحان",
    "slug": "seed_basil",
    "variants": [
      {
        "sku": "NS-0066-1",
        "name": "کیلو",
        "price": 550000,
        "containerSize": "کیلو",
        "portalPrice": 550000
      }
    ]
  },
  {
    "sourceRow": 73,
    "name": "تخم مغز آفتابگردان",
    "slug": "seed_kernel_sunflower",
    "variants": [
      {
        "sku": "NS-0069-1",
        "name": "کیلو",
        "price": 990000,
        "containerSize": "کیلو",
        "portalPrice": 990000
      }
    ]
  },
  {
    "sourceRow": 74,
    "name": "تخم مغز کدو",
    "slug": "seed_kernel_pumpkin",
    "variants": [
      {
        "sku": "NS-0070-1",
        "name": "کیلو",
        "price": 1500000,
        "containerSize": "کیلو",
        "portalPrice": 1500000
      }
    ]
  },
  {
    "sourceRow": 72,
    "name": "تخم کتان",
    "slug": "seed_flax",
    "variants": [
      {
        "sku": "NS-0068-1",
        "name": "کیلو",
        "price": 400000,
        "containerSize": "کیلو",
        "portalPrice": 400000
      }
    ]
  },
  {
    "sourceRow": 76,
    "name": "تمرهندی",
    "slug": "tamarind",
    "variants": [
      {
        "sku": "NS-0071-1",
        "name": "کیلو",
        "price": 500000,
        "containerSize": "کیلو",
        "portalPrice": 500000
      }
    ]
  },
  {
    "sourceRow": 83,
    "name": "جدوار",
    "slug": "zedoary",
    "variants": [
      {
        "sku": "NS-0077-1",
        "name": "کیلو",
        "price": 1200000,
        "containerSize": "کیلو",
        "portalPrice": 1200000
      }
    ]
  },
  {
    "sourceRow": 114,
    "name": "حنا بی رنگ",
    "slug": "colorless_henna",
    "variants": [
      {
        "sku": "NS-0107-1",
        "name": "250 گرمی",
        "price": 150000,
        "containerSize": "250 گرمی",
        "portalPrice": 150000
      }
    ]
  },
  {
    "sourceRow": 117,
    "name": "خرفه",
    "slug": "purslane",
    "variants": [
      {
        "sku": "NS-0109-1",
        "name": "کیلو",
        "price": 700000,
        "containerSize": "کیلو",
        "portalPrice": 700000
      }
    ]
  },
  {
    "sourceRow": 118,
    "name": "خمیر مایه فریمان",
    "slug": "fariman_yeast",
    "variants": [
      {
        "sku": "NS-0110-1",
        "name": "کیلو",
        "price": 490000,
        "containerSize": "کیلو",
        "portalPrice": 490000
      }
    ]
  },
  {
    "sourceRow": 126,
    "name": "رب انار",
    "slug": "pomegranate_paste",
    "variants": [
      {
        "sku": "NS-0118-1",
        "name": "کیلو",
        "price": 490000,
        "containerSize": "کیلو",
        "portalPrice": 490000
      }
    ]
  },
  {
    "sourceRow": 127,
    "name": "رزماری",
    "slug": "rosemary",
    "variants": [
      {
        "sku": "NS-0119-1",
        "name": "برگ",
        "price": 800000,
        "containerSize": "برگ",
        "portalPrice": 800000
      }
    ]
  },
  {
    "sourceRow": 202,
    "name": "زاج",
    "slug": "zaj",
    "variants": [
      {
        "sku": "NS-0191-1",
        "name": "کیلو",
        "price": 500000,
        "containerSize": "کیلو",
        "portalPrice": 500000
      }
    ]
  },
  {
    "sourceRow": 213,
    "name": "سدر",
    "slug": "sidr",
    "variants": [
      {
        "sku": "NS-0202-1",
        "name": "کیلو",
        "price": 500000,
        "containerSize": "کیلو",
        "portalPrice": 500000
      }
    ]
  },
  {
    "sourceRow": 216,
    "name": "سرمه",
    "slug": "surma",
    "variants": [
      {
        "sku": "NS-0205-1",
        "name": "کیلو",
        "price": 80000,
        "containerSize": "کیلو",
        "portalPrice": 80000
      }
    ]
  },
  {
    "sourceRow": 222,
    "name": "سمنو",
    "slug": "samanu",
    "variants": [
      {
        "sku": "NS-0210-1",
        "name": "کیلو",
        "price": 180000,
        "containerSize": "کیلو",
        "portalPrice": 180000
      }
    ]
  },
  {
    "sourceRow": 226,
    "name": "سویق ترکیبی",
    "slug": "saviq_mixed",
    "variants": [
      {
        "sku": "NS-0214-1",
        "name": "کیلو",
        "price": 500000,
        "containerSize": "کیلو",
        "portalPrice": 500000
      }
    ]
  },
  {
    "sourceRow": 231,
    "name": "سیاهدانه",
    "slug": "black_seed",
    "variants": [
      {
        "sku": "NS-0219-1",
        "name": "کیلو",
        "price": 1300000,
        "containerSize": "کیلو",
        "portalPrice": 1300000
      }
    ]
  },
  {
    "sourceRow": 244,
    "name": "شنبلیله تخم",
    "slug": "fenugreek_seed",
    "variants": [
      {
        "sku": "NS-0232-1",
        "name": "کیلو",
        "price": 700000,
        "containerSize": "کیلو",
        "portalPrice": 700000
      }
    ]
  },
  {
    "sourceRow": 245,
    "name": "شنبلیله تخم",
    "slug": "fenugreek_seed",
    "variants": [
      {
        "sku": "NS-0233-1",
        "name": "کیلو",
        "price": 700000,
        "containerSize": "کیلو",
        "portalPrice": 700000
      }
    ]
  },
  {
    "sourceRow": 246,
    "name": "شوید خشک",
    "slug": "dried_dill",
    "variants": [
      {
        "sku": "NS-0234-1",
        "name": "کیلو",
        "price": 950000,
        "containerSize": "کیلو",
        "portalPrice": 950000
      }
    ]
  },
  {
    "sourceRow": 247,
    "name": "شیرخشک قنادی",
    "slug": "confectionery_milk_powder",
    "variants": [
      {
        "sku": "NS-0235-1",
        "name": "کیلو",
        "price": 990000,
        "containerSize": "کیلو",
        "portalPrice": 990000
      }
    ]
  },
  {
    "sourceRow": 248,
    "name": "شیره 3 شیره",
    "slug": "syrup_3_syrup",
    "variants": [
      {
        "sku": "NS-0236-1",
        "name": "500 گرم",
        "price": 250000,
        "containerSize": "500 گرم",
        "portalPrice": 250000
      }
    ]
  },
  {
    "sourceRow": 249,
    "name": "شیره 4 شیره",
    "slug": "syrup_4_syrup",
    "variants": [
      {
        "sku": "NS-0237-1",
        "name": "500 گرم",
        "price": 250000,
        "containerSize": "500 گرم",
        "portalPrice": 250000
      }
    ]
  },
  {
    "sourceRow": 251,
    "name": "شیره انگور",
    "slug": "grape_syrup",
    "variants": [
      {
        "sku": "NS-0239-1",
        "name": "500 گرم",
        "price": 250000,
        "containerSize": "500 گرم",
        "portalPrice": 250000
      }
    ]
  },
  {
    "sourceRow": 252,
    "name": "شیره توت",
    "slug": "mulberry_syrup",
    "variants": [
      {
        "sku": "NS-0240-1",
        "name": "500 گرم",
        "price": 250000,
        "containerSize": "500 گرم",
        "portalPrice": 250000
      }
    ]
  },
  {
    "sourceRow": 254,
    "name": "شیره سفید",
    "slug": "white_syrup_500g",
    "variants": [
      {
        "sku": "NS-0242-1",
        "name": "500 گرم",
        "price": 380000,
        "containerSize": "500 گرم",
        "portalPrice": 380000
      },
      {
        "sku": "NS-0242-2",
        "name": "1 کیلو",
        "price": 760000,
        "containerSize": "1 کیلو",
        "portalPrice": 760000
      }
    ]
  },
  {
    "sourceRow": 255,
    "name": "شیره سیب",
    "slug": "apple_syrup",
    "variants": [
      {
        "sku": "NS-0243-1",
        "name": "500 گرم",
        "price": 300000,
        "containerSize": "500 گرم",
        "portalPrice": 300000
      }
    ]
  },
  {
    "sourceRow": 258,
    "name": "صابون 7 گیاه",
    "slug": "soap_7_herb",
    "variants": [
      {
        "sku": "NS-0246-1",
        "name": "کیلو",
        "price": 120000,
        "containerSize": "کیلو",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 259,
    "name": "صابون آرگان",
    "slug": "soap_argan",
    "variants": [
      {
        "sku": "NS-0249-1",
        "name": "کیلو",
        "price": 240000,
        "containerSize": "کیلو",
        "portalPrice": 240000
      }
    ]
  },
  {
    "sourceRow": 260,
    "name": "صابون آلبالو",
    "slug": "soap_sour_cherry",
    "variants": [
      {
        "sku": "NS-0250-1",
        "name": "کیلو",
        "price": 120000,
        "containerSize": "کیلو",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 261,
    "name": "صابون انار",
    "slug": "soap_pomegranate",
    "variants": [
      {
        "sku": "NS-0247-1",
        "name": "کیلو",
        "price": 120000,
        "containerSize": "کیلو",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 262,
    "name": "صابون انگور",
    "slug": "soap_grape",
    "variants": [
      {
        "sku": "NS-0248-1",
        "name": "کیلو",
        "price": 120000,
        "containerSize": "کیلو",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 263,
    "name": "صابون تریاک",
    "slug": "soap_tryak",
    "variants": [
      {
        "sku": "NS-0251-1",
        "name": "کیلو",
        "price": 250000,
        "containerSize": "کیلو",
        "portalPrice": 250000
      }
    ]
  },
  {
    "sourceRow": 265,
    "name": "صابون ذغال اکتیو",
    "slug": "soap_charcoal_active",
    "variants": [
      {
        "sku": "NS-0253-1",
        "name": "کیلو",
        "price": 150000,
        "containerSize": "کیلو",
        "portalPrice": 150000
      }
    ]
  },
  {
    "sourceRow": 268,
    "name": "صابون زیتون",
    "slug": "soap_olive",
    "variants": [
      {
        "sku": "NS-0256-1",
        "name": "کیلو",
        "price": 120000,
        "containerSize": "کیلو",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 269,
    "name": "صابون سفیداب",
    "slug": "soap_sefidab",
    "variants": [
      {
        "sku": "NS-0257-1",
        "name": "کیلو",
        "price": 100000,
        "containerSize": "کیلو",
        "portalPrice": 100000
      }
    ]
  },
  {
    "sourceRow": 270,
    "name": "صابون سیاهدانه",
    "slug": "soap_syahdanh",
    "variants": [
      {
        "sku": "NS-0258-1",
        "name": "کیلو",
        "price": 120000,
        "containerSize": "کیلو",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 271,
    "name": "صابون شیرالاغ",
    "slug": "soap_donkey_milk",
    "variants": [
      {
        "sku": "NS-0259-1",
        "name": "کیلو",
        "price": 250000,
        "containerSize": "کیلو",
        "portalPrice": 250000
      }
    ]
  },
  {
    "sourceRow": 273,
    "name": "صابون ماکادمیا",
    "slug": "soap_macadamia",
    "variants": [
      {
        "sku": "NS-0261-1",
        "name": "کیلو",
        "price": 220000,
        "containerSize": "کیلو",
        "portalPrice": 220000
      }
    ]
  },
  {
    "sourceRow": 274,
    "name": "صمغ",
    "slug": "gum",
    "variants": [
      {
        "sku": "NS-0262-1",
        "name": "کیلو",
        "price": 900000,
        "containerSize": "کیلو",
        "portalPrice": 900000
      }
    ]
  },
  {
    "sourceRow": 328,
    "name": "عود",
    "slug": "incense",
    "variants": [
      {
        "sku": "NS-0314-1",
        "name": "شاخه ای",
        "price": 30000,
        "containerSize": "شاخه ای",
        "portalPrice": 30000
      }
    ]
  },
  {
    "sourceRow": 329,
    "name": "غوره پودر",
    "slug": "unripe_grape_powder",
    "variants": [
      {
        "sku": "NS-0315-1",
        "name": "کیلو",
        "price": 1500000,
        "containerSize": "کیلو",
        "portalPrice": 1500000
      }
    ]
  },
  {
    "sourceRow": 335,
    "name": "قرص کمر",
    "slug": "tablet_back",
    "variants": [
      {
        "sku": "NS-0321-1",
        "name": "کیلو",
        "price": 500000,
        "containerSize": "کیلو",
        "portalPrice": 500000
      }
    ]
  },
  {
    "sourceRow": 336,
    "name": "قره قروت",
    "slug": "qarehqurut",
    "variants": [
      {
        "sku": "NS-0322-1",
        "name": "کیلو",
        "price": 250000,
        "containerSize": "کیلو",
        "portalPrice": 250000
      }
    ]
  },
  {
    "sourceRow": 337,
    "name": "قهوه اسپرسو",
    "slug": "espresso_coffee_1",
    "variants": [
      {
        "sku": "NS-0323-1",
        "name": "کیلو",
        "price": 2750000,
        "containerSize": "کیلو",
        "portalPrice": 2750000
      },
      {
        "sku": "NS-0323-2",
        "name": "بسته ای",
        "price": 225000,
        "containerSize": "بسته ای",
        "portalPrice": 225000
      }
    ]
  },
  {
    "sourceRow": 338,
    "name": "قهوه ترک",
    "slug": "turkish_coffee_1",
    "variants": [
      {
        "sku": "NS-0324-1",
        "name": "کیلو",
        "price": 2750000,
        "containerSize": "کیلو",
        "portalPrice": 2750000
      },
      {
        "sku": "NS-0324-2",
        "name": "بسته ای",
        "price": 225000,
        "containerSize": "بسته ای",
        "portalPrice": 225000
      }
    ]
  },
  {
    "sourceRow": 339,
    "name": "قهوه فوری",
    "slug": "instant_coffee",
    "variants": [
      {
        "sku": "NS-0325-1",
        "name": "کیلو",
        "price": 4900000,
        "containerSize": "کیلو",
        "portalPrice": 4900000
      }
    ]
  },
  {
    "sourceRow": 379,
    "name": "لیمو اسلایس",
    "slug": "sliced_lemon",
    "variants": [
      {
        "sku": "NS-0364-1",
        "name": "کیلو",
        "price": 1800000,
        "containerSize": "کیلو",
        "portalPrice": 1800000
      }
    ]
  },
  {
    "sourceRow": 380,
    "name": "لیمو ببری",
    "slug": "lemon_tiger",
    "variants": [
      {
        "sku": "NS-0365-1",
        "name": "کیلو",
        "price": 1950000,
        "containerSize": "کیلو",
        "portalPrice": 1950000
      }
    ]
  },
  {
    "sourceRow": 387,
    "name": "نارگیل سریلانکا چرب",
    "slug": "fat_sri_lankan_coconut",
    "variants": [
      {
        "sku": "NS-0370-1",
        "name": "کیلو",
        "price": 1750000,
        "containerSize": "کیلو",
        "portalPrice": 1750000
      }
    ]
  },
  {
    "sourceRow": 401,
    "name": "نوره",
    "slug": "depilatory",
    "variants": [
      {
        "sku": "NS-0383-1",
        "name": "نیم کیلو",
        "price": 120000,
        "containerSize": "نیم کیلو",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 60,
    "name": "پماد سرد",
    "slug": "ointment_cold_10_gram",
    "variants": [
      {
        "sku": "NS-0054-1",
        "name": "10 گرمی",
        "price": 250000,
        "containerSize": "10 گرمی",
        "portalPrice": 250000
      },
      {
        "sku": "NS-0054-2",
        "name": "20 گرمی",
        "price": 360000,
        "containerSize": "20 گرمی",
        "portalPrice": 360000
      },
      {
        "sku": "NS-NEW-0057-3",
        "name": "30 گرمی",
        "price": 500000,
        "containerSize": "30 گرمی",
        "portalPrice": 500000
      }
    ]
  },
  {
    "sourceRow": 61,
    "name": "پماد سیاه",
    "slug": "ointment_black",
    "variants": [
      {
        "sku": "NS-0055-1",
        "name": "کیلو",
        "price": 120000,
        "containerSize": "کیلو",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 63,
    "name": "پماد لطیف",
    "slug": "ointment_latif_20_gram",
    "variants": [
      {
        "sku": "NS-0057-1",
        "name": "20 گرمی",
        "price": 250000,
        "containerSize": "20 گرمی",
        "portalPrice": 250000
      },
      {
        "sku": "NS-0057-2",
        "name": "30 گرمی",
        "price": 360000,
        "containerSize": "30 گرمی",
        "portalPrice": 360000
      }
    ]
  },
  {
    "sourceRow": 62,
    "name": "پماد گرم",
    "slug": "ointment_warm_10_gram",
    "variants": [
      {
        "sku": "NS-0056-1",
        "name": "10 گرمی",
        "price": 250000,
        "containerSize": "10 گرمی",
        "portalPrice": 250000
      },
      {
        "sku": "NS-0056-2",
        "name": "20 گرمی",
        "price": 360000,
        "containerSize": "20 گرمی",
        "portalPrice": 360000
      },
      {
        "sku": "NS-NEW-0059-3",
        "name": "30 گرمی",
        "price": 500000,
        "containerSize": "30 گرمی",
        "portalPrice": 500000
      }
    ]
  },
  {
    "sourceRow": 58,
    "name": "پمادر درد (پماد ویکس)",
    "slug": "pmadr_pain_10_gram",
    "variants": [
      {
        "sku": "NS-0058-1",
        "name": "10 گرمی",
        "price": 250000,
        "containerSize": "10 گرمی",
        "portalPrice": 250000
      },
      {
        "sku": "NS-0058-2",
        "name": "20 گرمی",
        "price": 360000,
        "containerSize": "20 گرمی",
        "portalPrice": 360000
      },
      {
        "sku": "NS-NEW-0061-3",
        "name": "290",
        "price": 180000,
        "containerSize": "290",
        "portalPrice": 180000
      }
    ]
  },
  {
    "sourceRow": 59,
    "name": "پمادر درد (پماد ویکس) 55 گرمی",
    "slug": "pmadr_pain_55_gram",
    "variants": [
      {
        "sku": "NS-0059-1",
        "name": "کیلو",
        "price": 240000,
        "containerSize": "کیلو",
        "portalPrice": 240000
      }
    ]
  },
  {
    "sourceRow": 65,
    "name": "پودر سوخاری دانه درشت نارنجی",
    "slug": "coarse_orange_breadcrumbs",
    "variants": [
      {
        "sku": "NS-0061-1",
        "name": "کیلو",
        "price": 320000,
        "containerSize": "کیلو",
        "portalPrice": 320000
      }
    ]
  },
  {
    "sourceRow": 67,
    "name": "پودر کشک گوسفندی",
    "slug": "sheep_kashk_powder",
    "variants": [
      {
        "sku": "NS-0063-1",
        "name": "کیلو",
        "price": 1100000,
        "containerSize": "کیلو",
        "portalPrice": 1100000
      }
    ]
  },
  {
    "sourceRow": 68,
    "name": "پونه خشک",
    "slug": "pennyroyal_dried",
    "variants": [
      {
        "sku": "NS-0064-1",
        "name": "کیلو",
        "price": 700000,
        "containerSize": "کیلو",
        "portalPrice": 700000
      }
    ]
  },
  {
    "sourceRow": 105,
    "name": "چهار تخم",
    "slug": "four_seed_mix",
    "variants": [
      {
        "sku": "NS-0097-1",
        "name": "کیلو",
        "price": 700000,
        "containerSize": "کیلو",
        "portalPrice": 700000
      }
    ]
  },
  {
    "sourceRow": 104,
    "name": "چوبک",
    "slug": "soapwort",
    "variants": [
      {
        "sku": "NS-0098-1",
        "name": "ریشه خشک",
        "price": 900000,
        "containerSize": "ریشه خشک",
        "portalPrice": 900000
      }
    ]
  },
  {
    "sourceRow": 106,
    "name": "چیاسید",
    "slug": "chia-seed",
    "variants": [
      {
        "sku": "NS-0099-1",
        "name": "کیلو",
        "price": 890000,
        "containerSize": "کیلو",
        "portalPrice": 890000
      }
    ]
  },
  {
    "sourceRow": 353,
    "name": "کره نارگیل",
    "slug": "coconut_butter_195_warm",
    "variants": [
      {
        "sku": "NS-0339-1",
        "name": "195 گرم",
        "price": 400000,
        "containerSize": "195 گرم",
        "portalPrice": 400000
      },
      {
        "sku": "NS-0339-2",
        "name": "255 گرم",
        "price": 460000,
        "containerSize": "255 گرم",
        "portalPrice": 460000
      }
    ]
  },
  {
    "sourceRow": 350,
    "name": "کره پنج مغز",
    "slug": "five_nut_butter",
    "variants": [
      {
        "sku": "NS-0336-1",
        "name": "195 گرم",
        "price": 500000,
        "containerSize": "195 گرم",
        "portalPrice": 500000
      }
    ]
  },
  {
    "sourceRow": 358,
    "name": "کلوچه کلمپه",
    "slug": "cookie_kolompeh",
    "variants": [
      {
        "sku": "NS-0344-1",
        "name": "عددی",
        "price": 25000,
        "containerSize": "عددی",
        "portalPrice": 25000
      }
    ]
  },
  {
    "sourceRow": 364,
    "name": "کندر خوراکی",
    "slug": "edible_frankincense",
    "variants": [
      {
        "sku": "NS-0350-1",
        "name": "کیلو",
        "price": 5100000,
        "containerSize": "کیلو",
        "portalPrice": 5100000
      }
    ]
  },
  {
    "sourceRow": 341,
    "name": "کپسول خالی",
    "slug": "empty_capsule",
    "variants": [
      {
        "sku": "NS-0327-1",
        "name": "25 عددی",
        "price": 50000,
        "containerSize": "25 عددی",
        "portalPrice": 50000
      }
    ]
  },
  {
    "sourceRow": 366,
    "name": "گرده گل",
    "slug": "bee_pollen",
    "variants": [
      {
        "sku": "NS-0352-1",
        "name": "کیلو",
        "price": 1200000,
        "containerSize": "کیلو",
        "portalPrice": 1200000
      }
    ]
  },
  {
    "sourceRow": 367,
    "name": "گشنیز",
    "slug": "coriander",
    "variants": [
      {
        "sku": "NS-0353-1",
        "name": "کیلو",
        "price": 450000,
        "containerSize": "کیلو",
        "portalPrice": 450000
      }
    ]
  },
  {
    "sourceRow": 372,
    "name": "گل سرخ غنچه",
    "slug": "rose_bud",
    "variants": [
      {
        "sku": "NS-0356-1",
        "name": "کیلو",
        "price": 5200000,
        "containerSize": "کیلو",
        "portalPrice": 5200000
      }
    ]
  },
  {
    "sourceRow": 371,
    "name": "گل سرخ پرک",
    "slug": "rose_petals",
    "variants": [
      {
        "sku": "NS-0355-1",
        "name": "کیلو",
        "price": 5000000,
        "containerSize": "کیلو",
        "portalPrice": 5000000
      }
    ]
  },
  {
    "sourceRow": 370,
    "name": "گلرنگ",
    "slug": "safflower",
    "variants": [
      {
        "sku": "NS-0359-1",
        "name": "کیلو",
        "price": 3200000,
        "containerSize": "کیلو",
        "portalPrice": 3200000
      }
    ]
  },
  {
    "sourceRow": 376,
    "name": "گوجه پودر",
    "slug": "tomato_powder",
    "variants": [
      {
        "sku": "NS-0361-1",
        "name": "کیلو",
        "price": 790000,
        "containerSize": "کیلو",
        "portalPrice": 790000
      }
    ]
  },
  {
    "sourceRow": 32,
    "name": "ارده",
    "slug": "tahini",
    "variants": [
      {
        "sku": "NS-0024-1",
        "name": "کیلو",
        "price": 710000,
        "containerSize": "کیلو",
        "portalPrice": 710000
      }
    ]
  },
  {
    "sourceRow": 108,
    "name": "حلوا ارده ساده",
    "slug": "plain_tahini_halva",
    "variants": [
      {
        "sku": "NS-0101-1",
        "name": "500 گرمی",
        "price": 350000,
        "containerSize": "500 گرمی",
        "portalPrice": 350000
      }
    ]
  },
  {
    "sourceRow": 107,
    "name": "حلوا ارده پسته ای",
    "slug": "pistachio_tahini_halva",
    "variants": [
      {
        "sku": "NS-0100-1",
        "name": "500 گرمی",
        "price": 430000,
        "containerSize": "500 گرمی",
        "portalPrice": 430000
      }
    ]
  },
  {
    "sourceRow": 111,
    "name": "حلوا طنابی",
    "slug": "halva_rope",
    "variants": [
      {
        "sku": "NS-0104-1",
        "name": "کیلو",
        "price": 350000,
        "containerSize": "کیلو",
        "portalPrice": 350000
      }
    ]
  },
  {
    "sourceRow": 109,
    "name": "حلوا پشمکی",
    "slug": "halva_cotton",
    "variants": [
      {
        "sku": "NS-0102-1",
        "name": "کیلو",
        "price": 330000,
        "containerSize": "کیلو",
        "portalPrice": 330000
      }
    ]
  },
  {
    "sourceRow": 112,
    "name": "حلوا کشی",
    "slug": "halva_sticky",
    "variants": [
      {
        "sku": "NS-0105-1",
        "name": "کیلو",
        "price": 350000,
        "containerSize": "کیلو",
        "portalPrice": 350000
      }
    ]
  },
  {
    "sourceRow": 239,
    "name": "شکر قهوه ای",
    "slug": "brown_sugar",
    "variants": [
      {
        "sku": "NS-0227-1",
        "name": "کیلو",
        "price": 190000,
        "containerSize": "کیلو",
        "portalPrice": 190000
      }
    ]
  },
  {
    "sourceRow": 240,
    "name": "شکلات تخته ای وانیلی",
    "slug": "vanilla_bar_chocolate",
    "variants": [
      {
        "sku": "NS-0228-1",
        "name": "کیلو",
        "price": 700000,
        "containerSize": "کیلو",
        "portalPrice": 700000
      }
    ]
  },
  {
    "sourceRow": 242,
    "name": "شکلات نسوز کوکی",
    "slug": "bake_stable_cookie_chocolate",
    "variants": [
      {
        "sku": "NS-0230-1",
        "name": "کیلو",
        "price": 890000,
        "containerSize": "کیلو",
        "portalPrice": 890000
      }
    ]
  },
  {
    "sourceRow": 241,
    "name": "شکلات چیپسی تلخ",
    "slug": "dark_chocolate_chips",
    "variants": [
      {
        "sku": "NS-0229-1",
        "name": "کیلو",
        "price": 890000,
        "containerSize": "کیلو",
        "portalPrice": 890000
      }
    ]
  },
  {
    "sourceRow": 253,
    "name": "شیره خرما",
    "slug": "date_syrup",
    "variants": [
      {
        "sku": "NS-0241-1",
        "name": "500 گرم",
        "price": 250000,
        "containerSize": "500 گرم",
        "portalPrice": 250000
      }
    ]
  },
  {
    "sourceRow": 320,
    "name": "عسل بهار نارنج",
    "slug": "orange_blossom_honey_bdvn_mvm",
    "variants": [
      {
        "sku": "NS-0306-1",
        "name": "بدون موم",
        "price": 1300000,
        "containerSize": "بدون موم",
        "portalPrice": 1300000
      },
      {
        "sku": "NS-0306-2",
        "name": "با موم",
        "price": 1400000,
        "containerSize": "با موم",
        "portalPrice": 1400000
      }
    ]
  },
  {
    "sourceRow": 324,
    "name": "عسل کنار",
    "slug": "sidr_honey",
    "variants": [
      {
        "sku": "NS-0310-1",
        "name": "کیلو",
        "price": 700000,
        "containerSize": "کیلو",
        "portalPrice": 700000
      }
    ]
  },
  {
    "sourceRow": 403,
    "name": "وانیل خرسی شکری",
    "slug": "sugary_bear_vanilla",
    "variants": [
      {
        "sku": "NS-0388-1",
        "name": "کیلو",
        "price": 950000,
        "containerSize": "کیلو",
        "portalPrice": 950000
      }
    ]
  },
  {
    "sourceRow": 340,
    "name": "کاکائو",
    "slug": "kakayv",
    "variants": [
      {
        "sku": "NS-0326-1",
        "name": "کیلو",
        "price": 3000000,
        "containerSize": "کیلو",
        "portalPrice": 3000000
      }
    ]
  },
  {
    "sourceRow": 342,
    "name": "کرم ارده",
    "slug": "tahini_cream",
    "variants": [
      {
        "sku": "NS-0328-1",
        "name": "کیلو",
        "price": 900000,
        "containerSize": "کیلو",
        "portalPrice": 900000
      }
    ]
  },
  {
    "sourceRow": 347,
    "name": "کره بادام زمینی عسلی",
    "slug": "honey_peanut_butter",
    "variants": [
      {
        "sku": "NS-0333-1",
        "name": "کیلو",
        "price": 900000,
        "containerSize": "کیلو",
        "portalPrice": 900000
      }
    ]
  },
  {
    "sourceRow": 356,
    "name": "کلوچه زنجبیلی با شکر قهوه ای",
    "slug": "ginger_cookie_with_brown_sugar",
    "variants": [
      {
        "sku": "NS-0342-1",
        "name": "کیلو",
        "price": 350000,
        "containerSize": "کیلو",
        "portalPrice": 350000
      }
    ]
  },
  {
    "sourceRow": 357,
    "name": "کلوچه زنجبیلی با مغز خرما",
    "slug": "ginger_cookie_with_date_filling",
    "variants": [
      {
        "sku": "NS-0343-1",
        "name": "کیلو",
        "price": 500000,
        "containerSize": "کیلو",
        "portalPrice": 500000
      }
    ]
  },
  {
    "sourceRow": 363,
    "name": "کنجد لار ارده",
    "slug": "lar_sesame_for_tahini",
    "variants": [
      {
        "sku": "NS-0349-1",
        "name": "کیلو",
        "price": 680000,
        "containerSize": "کیلو",
        "portalPrice": 680000
      }
    ]
  },
  {
    "sourceRow": 38,
    "name": "آسیاب ادویه",
    "slug": "spice_grinder",
    "variants": [
      {
        "sku": "NS-0037-1",
        "name": "کیلویی",
        "price": 50000,
        "containerSize": "کیلویی",
        "portalPrice": 50000
      }
    ]
  },
  {
    "sourceRow": 275,
    "name": "ظرف 300 گرمی",
    "slug": "container_300_gram",
    "variants": [
      {
        "sku": "NS-0263-1",
        "name": "کیلو",
        "price": 30000,
        "containerSize": "کیلو",
        "portalPrice": 30000
      }
    ]
  },
  {
    "sourceRow": 276,
    "name": "ظرف اسپری",
    "slug": "container_spray_green",
    "variants": [
      {
        "sku": "NS-0264-1",
        "name": "سبز",
        "price": 70000,
        "containerSize": "سبز",
        "portalPrice": 70000
      },
      {
        "sku": "NS-0264-2",
        "name": "بزرگ",
        "price": 60000,
        "containerSize": "بزرگ",
        "portalPrice": 60000
      }
    ]
  },
  {
    "sourceRow": 278,
    "name": "ظرف بطری شیشه ای",
    "slug": "glass_bottle_container_half_liter",
    "variants": [
      {
        "sku": "NS-0266-1",
        "name": "نیم لیتر",
        "price": 18000,
        "containerSize": "نیم لیتر",
        "portalPrice": 18000
      },
      {
        "sku": "NS-0266-2",
        "name": "1 لیتر",
        "price": 23000,
        "containerSize": "1 لیتر",
        "portalPrice": 23000
      }
    ]
  },
  {
    "sourceRow": 277,
    "name": "ظرف بطری پلاستیکی",
    "slug": "plastic_bottle_container_half_liter",
    "variants": [
      {
        "sku": "NS-0265-1",
        "name": "نیم لیتر",
        "price": 18000,
        "containerSize": "نیم لیتر",
        "portalPrice": 18000
      },
      {
        "sku": "NS-0265-2",
        "name": "1 لیتر",
        "price": 30000,
        "containerSize": "1 لیتر",
        "portalPrice": 30000
      }
    ]
  },
  {
    "sourceRow": 279,
    "name": "ظرف جار",
    "slug": "container_jar_jar_25",
    "variants": [
      {
        "sku": "NS-0267-1",
        "name": "جار 25",
        "price": 32000,
        "containerSize": "جار 25",
        "portalPrice": 32000
      },
      {
        "sku": "NS-0267-2",
        "name": "جار 50",
        "price": 35000,
        "containerSize": "جار 50",
        "portalPrice": 35000
      }
    ]
  },
  {
    "sourceRow": 280,
    "name": "ظرف جار سایز 2",
    "slug": "jar_container_size_2_kvchk",
    "variants": [
      {
        "sku": "NS-0268-1",
        "name": "کوچک",
        "price": 15000,
        "containerSize": "کوچک",
        "portalPrice": 15000
      },
      {
        "sku": "NS-0268-2",
        "name": "متوسط",
        "price": 25000,
        "containerSize": "متوسط",
        "portalPrice": 25000
      }
    ]
  },
  {
    "sourceRow": 281,
    "name": "ظرف روغن موضعی",
    "slug": "topical_oil_container_30ml",
    "variants": [
      {
        "sku": "NS-0269-1",
        "name": "30 میل",
        "price": 12000,
        "containerSize": "30 میل",
        "portalPrice": 12000
      },
      {
        "sku": "NS-0269-2",
        "name": "60 میل",
        "price": 20000,
        "containerSize": "60 میل",
        "portalPrice": 20000
      }
    ]
  },
  {
    "sourceRow": 282,
    "name": "ظرف سطلی یک کیلویی",
    "slug": "one_kilo_bucket_container",
    "variants": [
      {
        "sku": "NS-0270-1",
        "name": "کیلو",
        "price": 50000,
        "containerSize": "کیلو",
        "portalPrice": 50000
      }
    ]
  },
  {
    "sourceRow": 283,
    "name": "ظرف کتابی",
    "slug": "book_shape_container_250_gram",
    "variants": [
      {
        "sku": "NS-0271-1",
        "name": "250 گرمی",
        "price": 22000,
        "containerSize": "250 گرمی",
        "portalPrice": 22000
      },
      {
        "sku": "NS-0271-2",
        "name": "400 گرمی",
        "price": 25000,
        "containerSize": "400 گرمی",
        "portalPrice": 25000
      }
    ]
  },
  {
    "sourceRow": 284,
    "name": "ظرف کوزه ای",
    "slug": "jug_container_kvchk",
    "variants": [
      {
        "sku": "NS-0272-1",
        "name": "کوچک",
        "price": 40000,
        "containerSize": "کوچک",
        "portalPrice": 40000
      },
      {
        "sku": "NS-0272-2",
        "name": "بزرگ",
        "price": 50000,
        "containerSize": "بزرگ",
        "portalPrice": 50000
      }
    ]
  },
  {
    "sourceRow": 57,
    "name": "پاکت",
    "slug": "pouch",
    "variants": [
      {
        "sku": "NS-0053-1",
        "name": "کیلویی",
        "price": 700000,
        "containerSize": "کیلویی",
        "portalPrice": 700000
      }
    ]
  },
  {
    "sourceRow": 4,
    "name": "آبغوره",
    "slug": "sour_grape_juice",
    "variants": [
      {
        "sku": "NS-0033-1",
        "name": "نیم لیتر",
        "price": 110000,
        "containerSize": "نیم لیتر",
        "portalPrice": 110000
      },
      {
        "sku": "NS-NEW-0036-2",
        "name": "1لیتر",
        "price": 210000,
        "containerSize": "1لیتر",
        "portalPrice": 210000
      }
    ]
  },
  {
    "sourceRow": 100,
    "name": "چای کوهی",
    "slug": "mountain_tea",
    "variants": [
      {
        "sku": "NS-0093-1",
        "name": "کیلو",
        "price": 710000,
        "containerSize": "کیلو",
        "portalPrice": 710000
      }
    ]
  },
  {
    "sourceRow": 41,
    "name": "آویشن شیرازی",
    "slug": "shirazi_thyme",
    "variants": [
      {
        "sku": "NS-0038-1",
        "name": "کیلو",
        "price": 4000000,
        "containerSize": "کیلو",
        "portalPrice": 4000000
      }
    ]
  },
  {
    "sourceRow": 42,
    "name": "آویشن کوهی",
    "slug": "wild_thyme",
    "variants": [
      {
        "sku": "NS-0039-1",
        "name": "کیلو",
        "price": 3900000,
        "containerSize": "کیلو",
        "portalPrice": 3900000
      }
    ]
  },
  {
    "sourceRow": 36,
    "name": "استویا",
    "slug": "stevia",
    "variants": [
      {
        "sku": "NS-0028-1",
        "name": "کیلو",
        "price": 2400000,
        "containerSize": "کیلو",
        "portalPrice": 2400000
      }
    ]
  },
  {
    "sourceRow": 37,
    "name": "اسطوخودوس",
    "slug": "lavender",
    "variants": [
      {
        "sku": "NS-0029-1",
        "name": "کیلو",
        "price": 2800000,
        "containerSize": "کیلو",
        "portalPrice": 2800000
      }
    ]
  },
  {
    "sourceRow": 34,
    "name": "اسپند تخم",
    "slug": "espand_seed",
    "variants": [
      {
        "sku": "NS-0026-1",
        "name": "کیلو",
        "price": 200000,
        "containerSize": "کیلو",
        "portalPrice": 200000
      }
    ]
  },
  {
    "sourceRow": 33,
    "name": "اسپند پودر",
    "slug": "espand_powder",
    "variants": [
      {
        "sku": "NS-0025-1",
        "name": "کیلو",
        "price": 180000,
        "containerSize": "کیلو",
        "portalPrice": 180000
      }
    ]
  },
  {
    "sourceRow": 43,
    "name": "بابونه",
    "slug": "chamomile",
    "variants": [
      {
        "sku": "NS-0040-1",
        "name": "کیلو",
        "price": 1000000,
        "containerSize": "کیلو",
        "portalPrice": 1000000
      }
    ]
  },
  {
    "sourceRow": 46,
    "name": "بادرنجبویه",
    "slug": "lemon_balm",
    "variants": [
      {
        "sku": "NS-0043-1",
        "name": "کیلو",
        "price": 1500000,
        "containerSize": "کیلو",
        "portalPrice": 1500000
      }
    ]
  },
  {
    "sourceRow": 47,
    "name": "بادیان ستاره ای",
    "slug": "star_anise",
    "variants": [
      {
        "sku": "NS-0044-1",
        "name": "کیلو",
        "price": 1950000,
        "containerSize": "کیلو",
        "portalPrice": 1950000
      }
    ]
  },
  {
    "sourceRow": 48,
    "name": "بارهنگ",
    "slug": "plantain",
    "variants": [
      {
        "sku": "NS-0045-1",
        "name": "کیلو",
        "price": 890000,
        "containerSize": "کیلو",
        "portalPrice": 890000
      }
    ]
  },
  {
    "sourceRow": 51,
    "name": "برگ بو",
    "slug": "bay_leaf",
    "variants": [
      {
        "sku": "NS-0048-1",
        "name": "کیلو",
        "price": 1500000,
        "containerSize": "کیلو",
        "portalPrice": 1500000
      }
    ]
  },
  {
    "sourceRow": 54,
    "name": "به خشک",
    "slug": "dried_quince",
    "variants": [
      {
        "sku": "NS-0051-1",
        "name": "کیلو",
        "price": 900000,
        "containerSize": "کیلو",
        "portalPrice": 900000
      }
    ]
  },
  {
    "sourceRow": 115,
    "name": "خاکشیر همدان",
    "slug": "hamedan_flixweed",
    "variants": [
      {
        "sku": "NS-0108-1",
        "name": "کیلو",
        "price": 240000,
        "containerSize": "کیلو",
        "portalPrice": 240000
      }
    ]
  },
  {
    "sourceRow": 209,
    "name": "زنیان",
    "slug": "ajwain",
    "variants": [
      {
        "sku": "NS-0198-1",
        "name": "کیلو",
        "price": 500000,
        "containerSize": "کیلو",
        "portalPrice": 500000
      }
    ]
  },
  {
    "sourceRow": 223,
    "name": "سنبل الطیب",
    "slug": "valerian",
    "variants": [
      {
        "sku": "NS-0211-1",
        "name": "کیلو",
        "price": 3400000,
        "containerSize": "کیلو",
        "portalPrice": 3400000
      }
    ]
  },
  {
    "sourceRow": 256,
    "name": "شیره شیرین بیان",
    "slug": "licorice_syrup",
    "variants": [
      {
        "sku": "NS-0244-1",
        "name": "کیلو",
        "price": 1800000,
        "containerSize": "کیلو",
        "portalPrice": 1800000
      }
    ]
  },
  {
    "sourceRow": 257,
    "name": "شیرین بیان چوب",
    "slug": "licorice_root",
    "variants": [
      {
        "sku": "NS-0245-1",
        "name": "کیلو",
        "price": 600000,
        "containerSize": "کیلو",
        "portalPrice": 600000
      }
    ]
  },
  {
    "sourceRow": 383,
    "name": "مرزه",
    "slug": "savory",
    "variants": [
      {
        "sku": "NS-0366-1",
        "name": "کیلو",
        "price": 850000,
        "containerSize": "کیلو",
        "portalPrice": 850000
      }
    ]
  },
  {
    "sourceRow": 390,
    "name": "نعناع خشک",
    "slug": "dried_mint",
    "variants": [
      {
        "sku": "NS-0373-1",
        "name": "کیلو",
        "price": 750000,
        "containerSize": "کیلو",
        "portalPrice": 750000
      }
    ]
  },
  {
    "sourceRow": 369,
    "name": "گل ختمی",
    "slug": "marshmallow_flower",
    "variants": [
      {
        "sku": "NS-0354-1",
        "name": "کیلو",
        "price": 1100000,
        "containerSize": "کیلو",
        "portalPrice": 1100000
      }
    ]
  },
  {
    "sourceRow": 373,
    "name": "گل گاوزبان",
    "slug": "borage_flower",
    "variants": [
      {
        "sku": "NS-0357-1",
        "name": "کیلو",
        "price": 3000000,
        "containerSize": "کیلو",
        "portalPrice": 3000000
      }
    ]
  },
  {
    "sourceRow": 25,
    "name": "ادویه گرم",
    "slug": "product_23_1",
    "variants": [
      {
        "sku": "NS-NEW-0023-1",
        "name": "پیش‌فرض",
        "price": 900000,
        "containerSize": "پیش‌فرض",
        "portalPrice": 900000
      }
    ]
  },
  {
    "sourceRow": 66,
    "name": "پودر شربت",
    "slug": "product_65_1",
    "variants": [
      {
        "sku": "NS-NEW-0065-1",
        "name": "پیش‌فرض",
        "price": 700000,
        "containerSize": "",
        "portalPrice": 700000
      }
    ]
  },
  {
    "sourceRow": 71,
    "name": "تخم شربتی",
    "slug": "product_70_1",
    "variants": [
      {
        "sku": "NS-NEW-0070-1",
        "name": "پیش‌فرض",
        "price": 720000,
        "containerSize": "پیش‌فرض",
        "portalPrice": 720000
      }
    ]
  },
  {
    "sourceRow": 75,
    "name": "ترنجبین",
    "slug": "product_74_1",
    "variants": [
      {
        "sku": "NS-NEW-0074-1",
        "name": "پیش‌فرض",
        "price": 4200000,
        "containerSize": "پیش‌فرض",
        "portalPrice": 4200000
      }
    ]
  },
  {
    "sourceRow": 78,
    "name": "تی بگ چربی سوز 15 گرمی",
    "slug": "product_77_1",
    "variants": [
      {
        "sku": "NS-NEW-0077-1",
        "name": "بسته",
        "price": 20000,
        "containerSize": "بسته",
        "portalPrice": 20000
      },
      {
        "sku": "NS-NEW-0077-2",
        "name": "کیلو",
        "price": 2400000,
        "containerSize": "کیلو",
        "portalPrice": 2400000
      }
    ]
  },
  {
    "sourceRow": 79,
    "name": "تی بگ خواب آور 7 گرمی",
    "slug": "product_78_1",
    "variants": [
      {
        "sku": "NS-NEW-0078-1",
        "name": "بسته",
        "price": 25000,
        "containerSize": "بسته",
        "portalPrice": 25000
      },
      {
        "sku": "NS-NEW-0078-2",
        "name": "کیلو",
        "price": 2900000,
        "containerSize": "کیلو",
        "portalPrice": 2900000
      }
    ]
  },
  {
    "sourceRow": 80,
    "name": "تی بگ ناب سرا",
    "slug": "product_79_1",
    "variants": [
      {
        "sku": "NS-NEW-0079-1",
        "name": "بسته",
        "price": 20000,
        "containerSize": "بسته",
        "portalPrice": 20000
      }
    ]
  },
  {
    "sourceRow": 81,
    "name": "تی بگ ویتامین سی 7 گرمی",
    "slug": "product_80_1",
    "variants": [
      {
        "sku": "NS-NEW-0080-1",
        "name": "بسته",
        "price": 15000,
        "containerSize": "بسته",
        "portalPrice": 15000
      },
      {
        "sku": "NS-NEW-0080-2",
        "name": "کیلو",
        "price": 2400000,
        "containerSize": "کیلو",
        "portalPrice": 2400000
      }
    ]
  },
  {
    "sourceRow": 82,
    "name": "ثعلب",
    "slug": "product_81_1",
    "variants": [
      {
        "sku": "NS-NEW-0081-1",
        "name": "پیش‌فرض",
        "price": 1190000,
        "containerSize": "پیش‌فرض",
        "portalPrice": 1190000
      }
    ]
  },
  {
    "sourceRow": 88,
    "name": "جوش شیرین",
    "slug": "baking-soda",
    "variants": [
      {
        "sku": "NS-NEW-0087-1",
        "name": "1000 گرم",
        "price": 150000,
        "containerSize": "1000 گرم",
        "portalPrice": 150000
      }
    ]
  },
  {
    "sourceRow": 90,
    "name": "چای انبه",
    "slug": "product_89_1",
    "variants": [
      {
        "sku": "NS-NEW-0089-1",
        "name": "پیش‌فرض",
        "price": 4800000,
        "containerSize": "",
        "portalPrice": 4800000
      }
    ]
  },
  {
    "sourceRow": 91,
    "name": "چای ترش ایرانی",
    "slug": "product_90_1",
    "variants": [
      {
        "sku": "NS-NEW-0090-1",
        "name": "پیش‌فرض",
        "price": 3500000,
        "containerSize": "پیش‌فرض",
        "portalPrice": 3500000
      }
    ]
  },
  {
    "sourceRow": 93,
    "name": "چای توت فرنگی",
    "slug": "product_92_1",
    "variants": [
      {
        "sku": "NS-NEW-0092-1",
        "name": "پیش‌فرض",
        "price": 3700000,
        "containerSize": "",
        "portalPrice": 3700000
      }
    ]
  },
  {
    "sourceRow": 94,
    "name": "چای چوب",
    "slug": "product_93_1",
    "variants": [
      {
        "sku": "NS-NEW-0093-1",
        "name": "پیش‌فرض",
        "price": 350000,
        "containerSize": "",
        "portalPrice": 350000
      }
    ]
  },
  {
    "sourceRow": 95,
    "name": "چای سبز ایرانی",
    "slug": "product_94_1",
    "variants": [
      {
        "sku": "NS-NEW-0094-1",
        "name": "پیش‌فرض",
        "price": 800000,
        "containerSize": "پیش‌فرض",
        "portalPrice": 800000
      }
    ]
  },
  {
    "sourceRow": 96,
    "name": "چای کرک پسته زعفران",
    "slug": "product_95_1",
    "variants": [
      {
        "sku": "NS-NEW-0095-1",
        "name": "پیش‌فرض",
        "price": 1850000,
        "containerSize": "",
        "portalPrice": 1850000
      }
    ]
  },
  {
    "sourceRow": 97,
    "name": "چای کرک کارامل",
    "slug": "product_96_1",
    "variants": [
      {
        "sku": "NS-NEW-0096-1",
        "name": "پیش‌فرض",
        "price": 1800000,
        "containerSize": "",
        "portalPrice": 1800000
      }
    ]
  },
  {
    "sourceRow": 98,
    "name": "چای کرک لاته موزی",
    "slug": "product_97_1",
    "variants": [
      {
        "sku": "NS-NEW-0097-1",
        "name": "پیش‌فرض",
        "price": 1590000,
        "containerSize": "",
        "portalPrice": 1590000
      }
    ]
  },
  {
    "sourceRow": 99,
    "name": "چای کرک هل",
    "slug": "product_98_1",
    "variants": [
      {
        "sku": "NS-NEW-0098-1",
        "name": "پیش‌فرض",
        "price": 1590000,
        "containerSize": "",
        "portalPrice": 1590000
      }
    ]
  },
  {
    "sourceRow": 101,
    "name": "چای ماسالا",
    "slug": "product_100_1",
    "variants": [
      {
        "sku": "NS-NEW-0100-1",
        "name": "پیش‌فرض",
        "price": 1800000,
        "containerSize": "",
        "portalPrice": 1800000
      }
    ]
  },
  {
    "sourceRow": 102,
    "name": "چای مراکش",
    "slug": "product_101_1",
    "variants": [
      {
        "sku": "NS-NEW-0101-1",
        "name": "پیش‌فرض",
        "price": 3800000,
        "containerSize": "",
        "portalPrice": 3800000
      }
    ]
  },
  {
    "sourceRow": 103,
    "name": "چای میوه ای",
    "slug": "product_102_1",
    "variants": [
      {
        "sku": "NS-NEW-0102-1",
        "name": "پیش‌فرض",
        "price": 1300000,
        "containerSize": "",
        "portalPrice": 1300000
      }
    ]
  },
  {
    "sourceRow": 116,
    "name": "خردل",
    "slug": "product_115_1",
    "variants": [
      {
        "sku": "NS-NEW-0115-1",
        "name": "پیش‌فرض",
        "price": 600000,
        "containerSize": "",
        "portalPrice": 600000
      }
    ]
  },
  {
    "sourceRow": 122,
    "name": "دمنوش 10 گیاه",
    "slug": "product_121_1",
    "variants": [
      {
        "sku": "NS-NEW-0121-1",
        "name": "پیش‌فرض",
        "price": 120000,
        "containerSize": "پیش‌فرض",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 123,
    "name": "دمنوش آویشن",
    "slug": "product_122_1",
    "variants": [
      {
        "sku": "NS-NEW-0122-1",
        "name": "پیش‌فرض",
        "price": 950000,
        "containerSize": "پیش‌فرض",
        "portalPrice": 950000
      }
    ]
  },
  {
    "sourceRow": 148,
    "name": "روغن تقویت مو (نابسرا)",
    "slug": "product_147_1",
    "variants": [
      {
        "sku": "NS-NEW-0147-1",
        "name": "پیش‌فرض",
        "price": 350000,
        "containerSize": "",
        "portalPrice": 350000
      }
    ]
  },
  {
    "sourceRow": 214,
    "name": "سرکه انگور",
    "slug": "product_210_1",
    "variants": [
      {
        "sku": "NS-NEW-0210-1",
        "name": "نیم کیلو",
        "price": 135000,
        "containerSize": "نیم کیلو",
        "portalPrice": 135000
      },
      {
        "sku": "NS-NEW-0210-2",
        "name": "1کیلو",
        "price": 260000,
        "containerSize": "1کیلو",
        "portalPrice": 260000
      }
    ]
  },
  {
    "sourceRow": 215,
    "name": "سرکه سیب",
    "slug": "product_211_1",
    "variants": [
      {
        "sku": "NS-NEW-0211-1",
        "name": "نیم کیلو",
        "price": 130000,
        "containerSize": "نیم کیلو",
        "portalPrice": 130000
      },
      {
        "sku": "NS-NEW-0211-2",
        "name": "1کیلو",
        "price": 250000,
        "containerSize": "1کیلو",
        "portalPrice": 250000
      }
    ]
  },
  {
    "sourceRow": 219,
    "name": "سماق قرمزگل",
    "slug": "product_215_1",
    "variants": [
      {
        "sku": "NS-NEW-0215-1",
        "name": "پیش‌فرض",
        "price": 3400000,
        "containerSize": "پیش‌فرض",
        "portalPrice": 3400000
      }
    ]
  },
  {
    "sourceRow": 236,
    "name": "شربت سرکه انگبین",
    "slug": "product_232_1",
    "variants": [
      {
        "sku": "NS-NEW-0232-1",
        "name": "نیم لیتر",
        "price": 250000,
        "containerSize": "نیم لیتر",
        "portalPrice": 250000
      },
      {
        "sku": "NS-NEW-0232-2",
        "name": "1لیتر",
        "price": 500000,
        "containerSize": "1لیتر",
        "portalPrice": 500000
      }
    ]
  },
  {
    "sourceRow": 237,
    "name": "شربت سکنجبین",
    "slug": "product_233_1",
    "variants": [
      {
        "sku": "NS-NEW-0233-1",
        "name": "نیم لیتر",
        "price": 155000,
        "containerSize": "نیم لیتر",
        "portalPrice": 155000
      },
      {
        "sku": "NS-NEW-0233-2",
        "name": "1لیتر",
        "price": 295000,
        "containerSize": "1لیتر",
        "portalPrice": 295000
      }
    ]
  },
  {
    "sourceRow": 264,
    "name": "صابون درخت چای",
    "slug": "product_260_1",
    "variants": [
      {
        "sku": "NS-NEW-0260-1",
        "name": "پیش‌فرض",
        "price": 120000,
        "containerSize": "",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 285,
    "name": "عرق استنشاقی",
    "slug": "product_281_1",
    "variants": [
      {
        "sku": "NS-NEW-0281-1",
        "name": "30میل",
        "price": 65000,
        "containerSize": "30میل",
        "portalPrice": 65000
      },
      {
        "sku": "NS-NEW-0281-2",
        "name": "60میل",
        "price": 120000,
        "containerSize": "60میل",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 286,
    "name": "عرق اسطوخودوس",
    "slug": "product_282_1",
    "variants": [
      {
        "sku": "NS-NEW-0282-1",
        "name": "نیم لیتر",
        "price": 100000,
        "containerSize": "نیم لیتر",
        "portalPrice": 100000
      },
      {
        "sku": "NS-NEW-0282-2",
        "name": "1 لیتر",
        "price": 190000,
        "containerSize": "1 لیتر",
        "portalPrice": 190000
      }
    ]
  },
  {
    "sourceRow": 287,
    "name": "عرق اکالیپتوس",
    "slug": "product_283_1",
    "variants": [
      {
        "sku": "NS-NEW-0283-1",
        "name": "نیم لیتر",
        "price": 65000,
        "containerSize": "نیم لیتر",
        "portalPrice": 65000
      },
      {
        "sku": "NS-NEW-0283-2",
        "name": "1 لیتر",
        "price": 120000,
        "containerSize": "1 لیتر",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 288,
    "name": "عرق آویشن",
    "slug": "product_284_1",
    "variants": [
      {
        "sku": "NS-NEW-0284-1",
        "name": "نیم لیتر",
        "price": 140000,
        "containerSize": "نیم لیتر",
        "portalPrice": 140000
      },
      {
        "sku": "NS-NEW-0284-2",
        "name": "1 لیتر",
        "price": 270000,
        "containerSize": "1 لیتر",
        "portalPrice": 270000
      }
    ]
  },
  {
    "sourceRow": 289,
    "name": "عرق بابونه",
    "slug": "product_285_1",
    "variants": [
      {
        "sku": "NS-NEW-0285-1",
        "name": "نیم لیتر",
        "price": 95000,
        "containerSize": "نیم لیتر",
        "portalPrice": 95000
      },
      {
        "sku": "NS-NEW-0285-2",
        "name": "1 لیتر",
        "price": 180000,
        "containerSize": "1 لیتر",
        "portalPrice": 180000
      }
    ]
  },
  {
    "sourceRow": 291,
    "name": "عرق بهار نارنج",
    "slug": "product_286_1",
    "variants": [
      {
        "sku": "NS-NEW-0286-1",
        "name": "نیم لیتر",
        "price": 140000,
        "containerSize": "نیم لیتر",
        "portalPrice": 140000
      },
      {
        "sku": "NS-NEW-0286-2",
        "name": "1 لیتر",
        "price": 270000,
        "containerSize": "1 لیتر",
        "portalPrice": 270000
      }
    ]
  },
  {
    "sourceRow": 290,
    "name": "عرق بولاغ اوتی",
    "slug": "product_287_1",
    "variants": [
      {
        "sku": "NS-NEW-0287-1",
        "name": "نیم لیتر",
        "price": 70000,
        "containerSize": "نیم لیتر",
        "portalPrice": 70000
      },
      {
        "sku": "NS-NEW-0287-2",
        "name": "1 لیتر",
        "price": 130000,
        "containerSize": "1 لیتر",
        "portalPrice": 130000
      }
    ]
  },
  {
    "sourceRow": 292,
    "name": "عرق بیدمشک",
    "slug": "product_288_1",
    "variants": [
      {
        "sku": "NS-NEW-0288-1",
        "name": "نیم لیتر",
        "price": 115000,
        "containerSize": "نیم لیتر",
        "portalPrice": 115000
      },
      {
        "sku": "NS-NEW-0288-2",
        "name": "1 لیتر",
        "price": 220000,
        "containerSize": "1 لیتر",
        "portalPrice": 220000
      }
    ]
  },
  {
    "sourceRow": 293,
    "name": "عرق پونه",
    "slug": "product_289_1",
    "variants": [
      {
        "sku": "NS-NEW-0289-1",
        "name": "نیم لیتر",
        "price": 80000,
        "containerSize": "نیم لیتر",
        "portalPrice": 80000
      },
      {
        "sku": "NS-NEW-0289-2",
        "name": "1 لیتر",
        "price": 150000,
        "containerSize": "1 لیتر",
        "portalPrice": 150000
      }
    ]
  },
  {
    "sourceRow": 294,
    "name": "عرق چهل گیاه",
    "slug": "product_290_1",
    "variants": [
      {
        "sku": "NS-NEW-0290-1",
        "name": "نیم لیتر",
        "price": 70000,
        "containerSize": "نیم لیتر",
        "portalPrice": 70000
      },
      {
        "sku": "NS-NEW-0290-2",
        "name": "1 لیتر",
        "price": 130000,
        "containerSize": "1 لیتر",
        "portalPrice": 130000
      }
    ]
  },
  {
    "sourceRow": 295,
    "name": "عرق خارشتر",
    "slug": "product_291_1",
    "variants": [
      {
        "sku": "NS-NEW-0291-1",
        "name": "نیم لیتر",
        "price": 70000,
        "containerSize": "نیم لیتر",
        "portalPrice": 70000
      },
      {
        "sku": "NS-NEW-0291-2",
        "name": "1 لیتر",
        "price": 130000,
        "containerSize": "1 لیتر",
        "portalPrice": 130000
      }
    ]
  },
  {
    "sourceRow": 296,
    "name": "عرق دارچین",
    "slug": "product_292_1",
    "variants": [
      {
        "sku": "NS-NEW-0292-1",
        "name": "نیم لیتر",
        "price": 80000,
        "containerSize": "نیم لیتر",
        "portalPrice": 80000
      },
      {
        "sku": "NS-NEW-0292-2",
        "name": "1 لیتر",
        "price": 150000,
        "containerSize": "1 لیتر",
        "portalPrice": 150000
      }
    ]
  },
  {
    "sourceRow": 297,
    "name": "عرق درمنه",
    "slug": "product_293_1",
    "variants": [
      {
        "sku": "NS-NEW-0293-1",
        "name": "نیم لیتر",
        "price": 120000,
        "containerSize": "نیم لیتر",
        "portalPrice": 120000
      },
      {
        "sku": "NS-NEW-0293-2",
        "name": "1 لیتر",
        "price": 240000,
        "containerSize": "1 لیتر",
        "portalPrice": 240000
      }
    ]
  },
  {
    "sourceRow": 298,
    "name": "عرق رازیانه",
    "slug": "product_294_1",
    "variants": [
      {
        "sku": "NS-NEW-0294-1",
        "name": "نیم لیتر",
        "price": 90000,
        "containerSize": "نیم لیتر",
        "portalPrice": 90000
      },
      {
        "sku": "NS-NEW-0294-2",
        "name": "1 لیتر",
        "price": 170000,
        "containerSize": "1 لیتر",
        "portalPrice": 170000
      }
    ]
  },
  {
    "sourceRow": 299,
    "name": "عرق رزماری",
    "slug": "product_295_1",
    "variants": [
      {
        "sku": "NS-NEW-0295-1",
        "name": "نیم لیتر",
        "price": 95000,
        "containerSize": "نیم لیتر",
        "portalPrice": 95000
      },
      {
        "sku": "NS-NEW-0295-2",
        "name": "1 لیتر",
        "price": 180000,
        "containerSize": "1 لیتر",
        "portalPrice": 180000
      }
    ]
  },
  {
    "sourceRow": 300,
    "name": "عرق رزماری اسپری",
    "slug": "product_296_1",
    "variants": [
      {
        "sku": "NS-NEW-0296-1",
        "name": "300 میل",
        "price": 105000,
        "containerSize": "300 میل",
        "portalPrice": 105000
      }
    ]
  },
  {
    "sourceRow": 301,
    "name": "عرق زنجبیل",
    "slug": "product_297_1",
    "variants": [
      {
        "sku": "NS-NEW-0297-1",
        "name": "نیم لیتر",
        "price": 80000,
        "containerSize": "نیم لیتر",
        "portalPrice": 80000
      },
      {
        "sku": "NS-NEW-0297-2",
        "name": "1 لیتر",
        "price": 150000,
        "containerSize": "1 لیتر",
        "portalPrice": 150000
      }
    ]
  },
  {
    "sourceRow": 302,
    "name": "عرق زنیان",
    "slug": "product_298_1",
    "variants": [
      {
        "sku": "NS-NEW-0298-1",
        "name": "نیم لیتر",
        "price": 80000,
        "containerSize": "نیم لیتر",
        "portalPrice": 80000
      },
      {
        "sku": "NS-NEW-0298-2",
        "name": "1 لیتر",
        "price": 150000,
        "containerSize": "1 لیتر",
        "portalPrice": 150000
      }
    ]
  },
  {
    "sourceRow": 303,
    "name": "عرق زیره سبز",
    "slug": "product_299_1",
    "variants": [
      {
        "sku": "NS-NEW-0299-1",
        "name": "نیم لیتر",
        "price": 105000,
        "containerSize": "نیم لیتر",
        "portalPrice": 105000
      },
      {
        "sku": "NS-NEW-0299-2",
        "name": "1 لیتر",
        "price": 200000,
        "containerSize": "1 لیتر",
        "portalPrice": 200000
      }
    ]
  },
  {
    "sourceRow": 304,
    "name": "عرق شاتره",
    "slug": "product_300_1",
    "variants": [
      {
        "sku": "NS-NEW-0300-1",
        "name": "نیم لیتر",
        "price": 80000,
        "containerSize": "نیم لیتر",
        "portalPrice": 80000
      },
      {
        "sku": "NS-NEW-0300-2",
        "name": "1 لیتر",
        "price": 150000,
        "containerSize": "1 لیتر",
        "portalPrice": 150000
      }
    ]
  },
  {
    "sourceRow": 305,
    "name": "عرق شنبلیله",
    "slug": "product_301_1",
    "variants": [
      {
        "sku": "NS-NEW-0301-1",
        "name": "نیم لیتر",
        "price": 70000,
        "containerSize": "نیم لیتر",
        "portalPrice": 70000
      },
      {
        "sku": "NS-NEW-0301-2",
        "name": "1 لیتر",
        "price": 130000,
        "containerSize": "1 لیتر",
        "portalPrice": 130000
      }
    ]
  },
  {
    "sourceRow": 306,
    "name": "عرق شوید",
    "slug": "product_302_1",
    "variants": [
      {
        "sku": "NS-NEW-0302-1",
        "name": "نیم لیتر",
        "price": 70000,
        "containerSize": "نیم لیتر",
        "portalPrice": 70000
      },
      {
        "sku": "NS-NEW-0302-2",
        "name": "1 لیتر",
        "price": 130000,
        "containerSize": "1 لیتر",
        "portalPrice": 130000
      }
    ]
  },
  {
    "sourceRow": 307,
    "name": "عرق کاسنی",
    "slug": "product_303_1",
    "variants": [
      {
        "sku": "NS-NEW-0303-1",
        "name": "نیم لیتر",
        "price": 80000,
        "containerSize": "نیم لیتر",
        "portalPrice": 80000
      },
      {
        "sku": "NS-NEW-0303-2",
        "name": "1 لیتر",
        "price": 150000,
        "containerSize": "1 لیتر",
        "portalPrice": 150000
      }
    ]
  },
  {
    "sourceRow": 308,
    "name": "عرق کاکوتی",
    "slug": "product_304_1",
    "variants": [
      {
        "sku": "NS-NEW-0304-1",
        "name": "نیم لیتر",
        "price": 70000,
        "containerSize": "نیم لیتر",
        "portalPrice": 70000
      },
      {
        "sku": "NS-NEW-0304-2",
        "name": "1 لیتر",
        "price": 130000,
        "containerSize": "1 لیتر",
        "portalPrice": 130000
      }
    ]
  },
  {
    "sourceRow": 309,
    "name": "عرق گزنه",
    "slug": "product_305_1",
    "variants": [
      {
        "sku": "NS-NEW-0305-1",
        "name": "نیم لیتر",
        "price": 80000,
        "containerSize": "نیم لیتر",
        "portalPrice": 80000
      },
      {
        "sku": "NS-NEW-0305-2",
        "name": "1 لیتر",
        "price": 150000,
        "containerSize": "1 لیتر",
        "portalPrice": 150000
      }
    ]
  },
  {
    "sourceRow": 313,
    "name": "عرق گل گاوزبان",
    "slug": "product_306_1",
    "variants": [
      {
        "sku": "NS-NEW-0306-1",
        "name": "نیم لیتر",
        "price": 90000,
        "containerSize": "نیم لیتر",
        "portalPrice": 90000
      },
      {
        "sku": "NS-NEW-0306-2",
        "name": "1 لیتر",
        "price": 170000,
        "containerSize": "1 لیتر",
        "portalPrice": 170000
      }
    ]
  },
  {
    "sourceRow": 311,
    "name": "عرق گلاب سنگین",
    "slug": "product_308_1",
    "variants": [
      {
        "sku": "NS-NEW-0308-1",
        "name": "نیم لیتر",
        "price": 195000,
        "containerSize": "نیم لیتر",
        "portalPrice": 195000
      },
      {
        "sku": "NS-NEW-0308-2",
        "name": "1 لیتر",
        "price": 380000,
        "containerSize": "1 لیتر",
        "portalPrice": 380000
      }
    ]
  },
  {
    "sourceRow": 314,
    "name": "عرق محرک پیاز مو",
    "slug": "product_310_1",
    "variants": [
      {
        "sku": "NS-NEW-0310-1",
        "name": "نیم لیتر",
        "price": 120000,
        "containerSize": "نیم لیتر",
        "portalPrice": 120000
      },
      {
        "sku": "NS-NEW-0310-2",
        "name": "1 لیتر",
        "price": 240000,
        "containerSize": "1 لیتر",
        "portalPrice": 240000
      }
    ]
  },
  {
    "sourceRow": 315,
    "name": "عرق معجون سنگ کلیه",
    "slug": "product_311_1",
    "variants": [
      {
        "sku": "NS-NEW-0311-1",
        "name": "نیم لیتر",
        "price": 95000,
        "containerSize": "نیم لیتر",
        "portalPrice": 95000
      },
      {
        "sku": "NS-NEW-0311-2",
        "name": "1 لیتر",
        "price": 180000,
        "containerSize": "1 لیتر",
        "portalPrice": 180000
      }
    ]
  },
  {
    "sourceRow": 316,
    "name": "عرق نعناع سنگین",
    "slug": "product_312_1",
    "variants": [
      {
        "sku": "NS-NEW-0312-1",
        "name": "نیم لیتر",
        "price": 80000,
        "containerSize": "نیم لیتر",
        "portalPrice": 80000
      },
      {
        "sku": "NS-NEW-0312-2",
        "name": "1 لیتر",
        "price": 150000,
        "containerSize": "1 لیتر",
        "portalPrice": 150000
      }
    ]
  },
  {
    "sourceRow": 317,
    "name": "عرق نعناع فلفلی",
    "slug": "product_313_1",
    "variants": [
      {
        "sku": "NS-NEW-0313-1",
        "name": "نیم لیتر",
        "price": 75000,
        "containerSize": "نیم لیتر",
        "portalPrice": 75000
      },
      {
        "sku": "NS-NEW-0313-2",
        "name": "1 لیتر",
        "price": 140000,
        "containerSize": "1 لیتر",
        "portalPrice": 140000
      }
    ]
  },
  {
    "sourceRow": 318,
    "name": "عرق هل سنگین",
    "slug": "product_314_1",
    "variants": [
      {
        "sku": "NS-NEW-0314-1",
        "name": "نیم لیتر",
        "price": 230000,
        "containerSize": "نیم لیتر",
        "portalPrice": 230000
      },
      {
        "sku": "NS-NEW-0314-2",
        "name": "1 لیتر",
        "price": 450000,
        "containerSize": "1 لیتر",
        "portalPrice": 450000
      }
    ]
  },
  {
    "sourceRow": 319,
    "name": "عرق یونجه",
    "slug": "product_315_1",
    "variants": [
      {
        "sku": "NS-NEW-0315-1",
        "name": "نیم لیتر",
        "price": 80000,
        "containerSize": "نیم لیتر",
        "portalPrice": 80000
      },
      {
        "sku": "NS-NEW-0315-2",
        "name": "1 لیتر",
        "price": 150000,
        "containerSize": "1 لیتر",
        "portalPrice": 150000
      }
    ]
  },
  {
    "sourceRow": 388,
    "name": "نبات طعم دار",
    "slug": "product_381_1",
    "variants": [
      {
        "sku": "NS-NEW-0381-1",
        "name": "کیلویی",
        "price": 250000,
        "containerSize": "کیلویی",
        "portalPrice": 250000
      }
    ]
  },
  {
    "sourceRow": 396,
    "name": "نمک صورتی نخودی (سنگ)",
    "slug": "product_390_1",
    "variants": [
      {
        "sku": "NS-NEW-0390-1",
        "name": "پیش‌فرض",
        "price": 120000,
        "containerSize": "",
        "portalPrice": 120000
      }
    ]
  },
  {
    "sourceRow": 400,
    "name": "نوتلا نابسرا",
    "slug": "product_394_1",
    "variants": [
      {
        "sku": "NS-NEW-0394-1",
        "name": "کیلویی",
        "price": 1500000,
        "containerSize": "کیلویی",
        "portalPrice": 1500000
      },
      {
        "sku": "NS-NEW-0394-2",
        "name": "بسته بندی",
        "price": 260000,
        "containerSize": "بسته بندی",
        "portalPrice": 260000
      }
    ]
  },
  {
    "sourceRow": 402,
    "name": "وانیل خالص",
    "slug": "product_400_1",
    "variants": [
      {
        "sku": "NS-NEW-0400-1",
        "name": "قوطی",
        "price": 180000,
        "containerSize": "قوطی",
        "portalPrice": 180000
      }
    ]
  },
  {
    "sourceRow": 381,
    "name": "محصول 4",
    "slug": "_4_1_",
    "variants": [
      {
        "sku": "NS-NEW-0402-1",
        "name": "1 کیلویی",
        "price": 1500000,
        "containerSize": "1 کیلویی",
        "portalPrice": 1500000
      }
    ]
  },
  {
    "sourceRow": 382,
    "name": "محصول شماره 5",
    "slug": "_5_1_",
    "variants": [
      {
        "sku": "NS-NEW-0403-1",
        "name": "1 کیلویی",
        "price": 1500000,
        "containerSize": "1 کیلویی",
        "portalPrice": 1500000
      }
    ]
  },
  {
    "sourceRow": 2,
    "name": "123",
    "slug": "123_123123",
    "variants": [
      {
        "sku": "NS-NEW-0404-1",
        "name": "123123",
        "price": 1212222,
        "containerSize": "123123",
        "portalPrice": 1212222
      }
    ]
  },
  {
    "sourceRow": 199,
    "name": "روغنیی",
    "slug": "product_405_1_",
    "variants": [
      {
        "sku": "NS-NEW-0405-1",
        "name": "1 کیلویی",
        "price": 21111,
        "containerSize": "1 کیلویی",
        "portalPrice": 21111
      }
    ]
  },
  {
    "sourceRow": 200,
    "name": "روغنیییی",
    "slug": "product_406_1_",
    "variants": [
      {
        "sku": "NS-NEW-0406-1",
        "name": "1 کیلویی",
        "price": 1211111,
        "containerSize": "1 کیلویی",
        "portalPrice": 1211111
      }
    ]
  },
  {
    "sourceRow": 201,
    "name": "به لیمو برگ",
    "slug": "behlimo",
    "variants": [
      {
        "sku": "NS-NEW-0407-1",
        "name": "۱ کیلو",
        "price": 3400000,
        "containerSize": "۱ کیلو",
        "portalPrice": 3400000
      },
      {
        "sku": "NS-NEW-0407-2",
        "name": "2 کیلویی",
        "price": 325000,
        "containerSize": "2 کیلویی",
        "portalPrice": 325000
      },
      {
        "sku": "NS-NEW-0407-3",
        "name": "4 کیلویی",
        "price": 45000000,
        "containerSize": "4 کیلویی",
        "portalPrice": 45000000
      }
    ]
  },
  {
    "sourceRow": 55,
    "name": "به لیمو برگ",
    "slug": "___",
    "variants": [
      {
        "sku": "NS-NEW-0407-1",
        "name": "۱ کیلو",
        "price": 3400000,
        "containerSize": "۱ کیلو",
        "portalPrice": 3400000
      }
    ]
  }
];

function norm(s) {
  return String(s || '')
    .trim()
    .replace(/\u200c/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function isJunkWeight(label) {
  const t = norm(label).replace(/\s+/g, '');
  if (!t) return false;
  // ۱۰۰گرم / ۲۰۰ گرم / 100g / 250گرم و مشابه — در فایل مرجع نیستند
  if (/^(100|200|250|50|150|300|400|500)(گرم|gr|g)$/i.test(t)) return true;
  if (/^(100|200|250|50|150)g$/i.test(t)) return true;
  if (/^\d{2,4}گرم$/.test(t)) return true;
  return false;
}

const report = {
  updated: [],
  skippedNoMatch: [],
  junkRemoved: [],
  felfelCheck: null
};

const claimedIds = new Set();

for (const group of CANONICAL_GROUPS) {
  const skus = (group.variants || []).map((v) => String(v.sku || '').trim()).filter(Boolean);
  if (!skus.length) continue;

  let product = db.getCollection('products').findOne({
    $or: [{ sku: { $in: skus } }, { 'variants.sku': { $in: skus } }]
  });

  // اگر همین سند قبلاً برای source_row دیگری استفاده شده، محصول جدا لازم است
  if (product && claimedIds.has(String(product._id))) {
    product = null;
  }

  if (!product) {
    const byName = db.getCollection('products').find({ name: group.name }).toArray();
    product = byName.find((p) => !claimedIds.has(String(p._id))) || null;
  }

  if (!product) {
    report.skippedNoMatch.push({
      name: group.name,
      sourceRow: group.sourceRow,
      skus
    });
    continue;
  }

  claimedIds.add(String(product._id));

  const oldVariants = Array.isArray(product.variants) ? product.variants : [];
  const stockBySku = {};
  for (const v of oldVariants) {
    const sku = String(v.sku || '').trim();
    if (sku) stockBySku[sku] = Number(v.stock || 0);
  }

  const nextVariants = (group.variants || []).map((v, i) => {
    const sku = String(v.sku || '').trim();
    const prev = oldVariants.find((x) => String(x.sku || '').trim() === sku) || {};
    const row = {
      name: v.name || 'پیش‌فرض',
      sku,
      price: Number(v.price || 0),
      portalPrice: Number(v.portalPrice != null ? v.portalPrice : v.price || 0),
      hasSitePrice: Boolean(prev.hasSitePrice) || false,
      sitePercent: prev.sitePercent,
      hasWholesale: i === 0 ? Boolean(product.hasWholesale || prev.hasWholesale) : false,
      wholesaleDirection: prev.wholesaleDirection || product.wholesaleDirection || 'less',
      wholesaleMode: prev.wholesaleMode || product.wholesaleMode || 'percent',
      wholesalePercent:
        prev.wholesalePercent != null ? prev.wholesalePercent : product.wholesalePercent,
      wholesaleAmount:
        prev.wholesaleAmount != null ? prev.wholesaleAmount : product.wholesaleAmount,
      wholesaleQty: prev.wholesaleQty || product.wholesaleQty || '',
      stock: stockBySku[sku] != null ? stockBySku[sku] : Number(prev.stock || 0),
      weight: prev.weight,
      weightUnit: prev.weightUnit,
      containerSize: v.containerSize || v.name || '',
      isDefault: i === 0
    };
    if (prev._id) row._id = prev._id;
    return row;
  });

  const primary = nextVariants[0] || {};
  const attrs = Object.assign({}, product.attributes || {}, {
    sourceRow: group.sourceRow || undefined,
    excelSlug: group.slug || undefined,
    source: 'canonical-excel-fix'
  });

  db.getCollection('products').updateOne(
    { _id: product._id },
    {
      $set: {
        name: group.name,
        price: Number(primary.price || 0),
        portalPrice: Number(primary.portalPrice || primary.price || 0),
        sku: primary.sku || product.sku,
        containerSize: primary.containerSize || '',
        variants: nextVariants,
        attributes: attrs,
        updatedAt: new Date()
      }
    }
  );

  report.updated.push({
    _id: String(product._id),
    from: product.name,
    to: group.name,
    sourceRow: group.sourceRow,
    variants: nextVariants.map((v) => ({ sku: v.sku, name: v.name, price: v.price }))
  });
}

// پاک‌سازی واریانت‌های جینک باقی‌مانده (۱۰۰گرم / ۲۰۰گرم / ...)
db.getCollection('products')
  .find({})
  .forEach((product) => {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    if (!variants.length) return;
    const kept = variants.filter((v) => !isJunkWeight(v.name) && !isJunkWeight(v.containerSize));
    if (kept.length === variants.length) return;
    if (!kept.length) return;
    if (!kept.some((v) => v.isDefault)) kept[0].isDefault = true;
    const primary = kept.find((v) => v.isDefault) || kept[0];
    db.getCollection('products').updateOne(
      { _id: product._id },
      {
        $set: {
          variants: kept,
          price: Number(primary.price || product.price || 0),
          portalPrice: Number(
            primary.portalPrice != null
              ? primary.portalPrice
              : primary.price || product.portalPrice || 0
          ),
          containerSize: primary.containerSize || primary.name || '',
          updatedAt: new Date()
        }
      }
    );
    report.junkRemoved.push({
      _id: String(product._id),
      name: product.name,
      removed: variants.length - kept.length,
      kept: kept.map((v) => v.name)
    });
  });

// صحت‌سنجی: فلفل قرمز ایرانی باید کیلو = ۶۰۰۰۰۰ باشد
report.felfelCheck = db
  .getCollection('products')
  .find({
    $or: [
      { name: 'فلفل قرمز ایرانی' },
      { sku: 'NS-0318-1' },
      { 'variants.sku': 'NS-0318-1' }
    ]
  })
  .toArray()
  .map((p) => ({
    _id: String(p._id),
    name: p.name,
    price: p.price,
    portalPrice: p.portalPrice,
    variants: (p.variants || []).map((v) => ({
      name: v.name,
      sku: v.sku,
      price: v.price,
      portalPrice: v.portalPrice,
      containerSize: v.containerSize
    }))
  }));

print('========== RESULT ==========');
print('updated:', report.updated.length);
print('skipped (no mongo match):', report.skippedNoMatch.length);
print('junk cleaned products:', report.junkRemoved.length);
print('--- فلفل قرمز ایرانی ---');
printjson(report.felfelCheck);
print('--- sample skipped ---');
printjson(report.skippedNoMatch.slice(0, 20));
print('--- sample junk removed ---');
printjson(report.junkRemoved.slice(0, 20));
