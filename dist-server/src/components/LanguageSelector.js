import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { languages } from '../i18n/languages';
const LanguageSelector = ({ compact = false }) => {
    const { i18n, t } = useTranslation('settings');
    const handleLanguageChange = (event) => {
        const newLanguage = event.target.value;
        i18n.changeLanguage(newLanguage);
    };
    // Compact style for QuickSettingsPanel
    if (compact) {
        return (_jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600", children: [_jsxs("span", { className: "flex items-center gap-2 text-sm text-gray-900 dark:text-white", children: [_jsx(Languages, { className: "h-4 w-4 text-gray-600 dark:text-gray-400" }), t('account.language')] }), _jsx("select", { value: i18n.language, onChange: handleLanguageChange, className: "w-[100px] text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400", children: languages.map((lang) => (_jsx("option", { value: lang.value, children: lang.nativeName }, lang.value))) })] }));
    }
    // Full style for Settings page
    return (_jsx("div", { className: "bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-900 dark:text-gray-100 mb-1", children: t('account.languageLabel') }), _jsx("div", { className: "text-sm text-gray-600 dark:text-gray-400", children: t('account.languageDescription') })] }), _jsx("select", { value: i18n.language, onChange: handleLanguageChange, className: "text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 w-36", children: languages.map((lang) => (_jsx("option", { value: lang.value, children: lang.nativeName }, lang.value))) })] }) }));
};
export default LanguageSelector;
