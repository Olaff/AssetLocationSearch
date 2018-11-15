using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Assets.Location.Search.Models
{
    public class GeoIpData
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string City { get; set; }
        public string State { get; set; }

        public bool IsDefault { get; set; }

        public GeoIpData()
        {
            City = string.Empty;
            State = string.Empty;
            Latitude = 0;
            Longitude = 0;
            IsDefault = true;
        }

        public GeoIpData(string city, string state, double? latitude, double? longitude)
        {
            City = city;
            State = state;
            Latitude = latitude.Value;
            Longitude = longitude.Value;
            IsDefault = false;
        }
    }
}