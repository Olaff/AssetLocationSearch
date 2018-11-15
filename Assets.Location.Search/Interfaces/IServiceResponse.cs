using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Assets.Location.Search.Interfaces
{
    public interface IServiceResponse
    {
        bool Success { get; set; }
        string Message { get; set; }
    }
}
