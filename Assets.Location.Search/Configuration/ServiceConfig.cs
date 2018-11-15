using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Assets.Location.Search.Configuration
{
    public static class ServiceConfig
    {
        public static string IpStackKey
        {
            get
            {
                return Sitecore.Configuration.Settings.GetSetting("ipStackKey");
            }
        }

        public static string IpStackEndpointUrl
        {
            get
            {
                return Sitecore.Configuration.Settings.GetSetting("ipStackEndpoint");
            }
        }

        public static string GoogleMapsApiKey
        {
            get
            {
                return Sitecore.Configuration.Settings.GetSetting("googleMapsApiKey");
            }
        }

        public static string GeocodeEnpointUrl
        {
            get
            {
                return Sitecore.Configuration.Settings.GetSetting("geocodeEndpoint");
            }
        }
    }
}