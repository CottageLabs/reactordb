using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using CMS.UIControls;

public partial class CMS_CMSTemplates_WNA_WNA : TemplateMasterPage
{
    protected void Page_Load(object sender, EventArgs e)
    {

        if (this.Page.Request.RawUrl == "/" || this.Page.Request.RawUrl == "")
        {
            BreadccrumbCtrl.Style.Value = "display:none;";
        }

        if (this.Page.Request.RawUrl.ToString().StartsWith("/reactor/default.aspx/"))
        {
            BreadccrumbCtrl.Style.Value = "display:none;";
            string ReactorName = this.Page.Request.RawUrl.ToString().Substring(this.Page.Request.RawUrl.ToString().LastIndexOf("/") + 1);
            ManualBreadcrumb.Text = "<div id=\"ctl00_BreadccrumbCtrl\" class=\"col-xs-12 breadcrumb\"><a class=\"CMSBreadCrumbsLink\" href=\"/\">Home</a>/<a class=\"CMSBreadCrumbsLink\" href=\"/Information-Library.aspx\">Information Library</a>/<a class=\"CMSBreadCrumbsLink\" href=\"/Information-Library/Facts-and-Figures.aspx\">Facts and Figures</a>/<a class=\"CMSBreadCrumbsLink\" href=\"/Information-Library/Facts-and-Figures/Reactor-Database.aspx\">Reactor Database</a>/<span class=\"CMSBreadCrumbsCurrentItem\">" + ReactorName + "</span></div>";
        }
        else if (this.Page.Request.RawUrl.ToString().StartsWith("/country/default.aspx/"))
        {
            BreadccrumbCtrl.Style.Value = "display:none;";
            string CountryName = this.Page.Request.RawUrl.ToString().Substring(this.Page.Request.RawUrl.ToString().LastIndexOf("/") + 1);
            ManualBreadcrumb.Text = "<div id=\"ctl00_BreadccrumbCtrl\" class=\"col-xs-12 breadcrumb\"><a class=\"CMSBreadCrumbsLink\" href=\"/\">Home</a>/<a class=\"CMSBreadCrumbsLink\" href=\"/Information-Library.aspx\">Information Library</a>/<a class=\"CMSBreadCrumbsLink\" href=\"/Information-Library/Facts-and-Figures.aspx\">Facts and Figures</a>/<a class=\"CMSBreadCrumbsLink\" href=\"/Information-Library/Facts-and-Figures/Reactor-Database.aspx\">Reactor Database</a>/<span class=\"CMSBreadCrumbsCurrentItem\">" + CountryName + "</span></div>";
        }
        else
        {
            ManualBreadcrumb.Visible = false;
        }
        
    }
    protected override void CreateChildControls()
    {
        base.CreateChildControls();
        PageManager = manPortal;
    }
    protected override void OnPreRender(EventArgs e)
    {
        base.OnPreRender(e);
        this.ltlTags.Text = this.HeaderTags;
    }
}
