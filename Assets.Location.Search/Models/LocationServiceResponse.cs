using Assets.Location.Search.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Assets.Location.Search.Models
{
    public class LocationServiceResponse: IServiceResponse
    {
        public string Message { get; set; }
        public bool Success { get; set; }

        public LocationServiceResponse ()
        {
            this.Message = string.Empty;
            this.Success = false;
        }
    }
}