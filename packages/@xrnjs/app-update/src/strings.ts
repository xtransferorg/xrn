// Import JSON files using require
import enStrings from "./i18n/en";
import esESStrings from "./i18n/es_ES";
import frFRStrings from "./i18n/fr_FR";
import idIDStrings from "./i18n/id_ID";
import ptBRStrings from "./i18n/pt_BR";
import viVNStrings from "./i18n/vi_VN";
import zhStrings from "./i18n/zh";
import zhTWStrings from "./i18n/zh-TW";

export interface FallbackPageStrings {
  title: string;
  description: string;
  upgrade_button_text: string;
  system_version_low_title: string;
  download_error_toast: string;
  downloading_background_toast: string;
  downloading_progress_text: string;
  update_error_button_text: string;
  later_button_text: string;
  update_description: string;
  already_latest_version: string;
  check_update_failed: string;
  new_version_found: string;
  system_version_low_message: string;
  system_version_low_exit_button_text: string;
  system_version_low_upgrade_button_text: string;
}

const strings: Record<string, FallbackPageStrings> = {
  zh: zhStrings,
  en: enStrings,
  "zh-TW": zhTWStrings,
  es_ES: esESStrings,
  fr_FR: frFRStrings,
  id_ID: idIDStrings,
  pt_BR: ptBRStrings,
  vi_VN: viVNStrings,
};

export const getStrings = (language: string = "zh"): FallbackPageStrings => {
  return strings[language] || strings.en;
};
