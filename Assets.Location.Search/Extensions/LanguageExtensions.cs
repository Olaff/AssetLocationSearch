using Sitecore.Globalization;
using Sitecore.Mvc.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Assets.Location.Search.Extensions
{
    public static class LanguageExtensions
    {
        public static string Dictionary (this SitecoreHelper helper, string relativeKeyPath, string defaultValue = "")
        {
            var translated = Translate.Text(relativeKeyPath);
            return translated.ToLower().Equals(relativeKeyPath.ToLower()) ? defaultValue : translated;
        }

        public static string Dictionary (string relativeKeyPath, string defaultValue = "")
        {
            var translated = Translate.Text(relativeKeyPath);
            return translated.ToLower().Equals(relativeKeyPath.ToLower()) ? defaultValue : translated;
        }
    }
}