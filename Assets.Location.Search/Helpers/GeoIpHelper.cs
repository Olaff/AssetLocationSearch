using Assets.Location.Search.Models;
using Sitecore.Analytics;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Assets.Location.Search.Helpers
{
    public static class GeoIpHelper
    {
        public static GeoIpData GetCurrentLocation ()
        {
            GeoIpData currentGeoIpData;


            try

            {
                var interactionData = Tracker.Current.Interaction;

                if ( interactionData.HasGeoIpData && interactionData.GeoData.Latitude != null )
                {
                    currentGeoIpData = new GeoIpData(interactionData.GeoData.City, interactionData.GeoData.Region, interactionData.GeoData.Latitude, interactionData.GeoData.Longitude);
                }
                else
                {
                    currentGeoIpData = new GeoIpData();
                }
            }
            catch ( Exception )
            {
                currentGeoIpData = new GeoIpData();
                //TODO: Improve this patch to possible write to logs
            }

            return currentGeoIpData;
        }
    }
}