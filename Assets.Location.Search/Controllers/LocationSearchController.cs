using Assets.Location.Search.Helpers;
using Assets.Location.Search.Interfaces;
using Assets.Location.Search.Models;
using Assets.Location.Search.Services;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace Assets.Location.Search.Controllers
{
    public class LocationSearchController : Controller
    {
        protected GeoLocationService<GeocodeResponse> GeoLocationService { get; set; }

        public LocationSearchController ()
        {
            GeoLocationService = new GeoLocationService<GeocodeResponse>();
        }

        public ActionResult RenderCreationPage ()
        {
            return View("~/Views/LocationSearch/FetchLocation.cshtml");
        }

        public async Task<PartialViewResult> FetchLocation(string ipAddress)
        {
            GeocodeResponse response;
            var headerAttributes = new NameValueCollection();
            headerAttributes.Add("access_key", Configuration.ServiceConfig.IpStackKey);
            

            if ( IsCached("ipAddress", ipAddress))
            {
                 response = GetFromCache<GeocodeResponse>("geocodeResponse");
            }
            else
            {
                response = await GeoLocationService.GetData(Configuration.ServiceConfig.IpStackEndpointUrl, headerAttributes, ipAddress, true);
                SetToCache("ipAddress", ipAddress);
                SetToCache("geocodeResponse", response);
            }
            return PartialView("~/Views/LocationSearch/LocationPreview.cshtml", response);
        }

        public JsonResult CreateLocations(int? quantity)
        {
            IServiceResponse response;
            var geocodeResponse = GetFromCache<GeocodeResponse>("geocodeResponse");

            if ( geocodeResponse != null )
            {
                response = new LocationService(quantity).CreateLocationItems(geocodeResponse);
            }
            else
            {
                response = new LocationServiceResponse();
                response.Message = "Could not fetch geocode response, please try again";
                response.Success = false;
            }

            return Json(response);
        }

        private T GetFromCache<T>(string key)
        {
            return (T)HttpContext.Cache[key];
        }

        private void SetToCache<T>(string key, T myObject)
        {
            HttpContext.Cache[key] = myObject;
        }

        private bool IsCached<T>(string key, T currentValue)
        {
            var cachedObject = HttpContext.Cache[key];

            return (cachedObject != null && cachedObject.Equals(currentValue)) ? true : false;
        }
    }
}