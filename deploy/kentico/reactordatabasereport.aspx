<%@ Page Title="" Language="C#" MasterPageFile="reactor.master" AutoEventWireup="true" CodeFile="reactordatabase.aspx.cs" Inherits="CMS_CMSTemplates_WNA_Basket" %>

<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolderHead" Runat="Server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="plcMain" Runat="Server">
    <div class="col-md-12 col-xs-12 genericContent">
        <div id="generic-report"></div>
    <cms:CMSPagePlaceholder ID="plcZones" runat="server">
    <LayoutTemplate>
        <cms:CMSWebPartZone ID="zContentZone" ZoneTitle="Content zone" runat="Server"></cms:CMSWebPartZone>
    </LayoutTemplate>
    </cms:CMSPagePlaceholder> 
    </div>
</asp:Content>
<asp:Content ID="Content3" ContentPlaceHolderID="ContentPlaceHolderScriptsFooter" Runat="Server">
        <script type="text/javascript">
            jQuery(document).ready(function($) {
                var year = 2017;
                reactordb.makeGenericReport({
                    selector: "#generic-report",
                    year: year,
                    reactor_search_url: "//reactordb.world-nuclear.org/query/reactor/_search",
                    operation_search_url: "//reactordb.world-nuclear.org/custom/operation/_search?year=" + year,
                    reactorPageURLTemplate: "//www.world-nuclear.org/reactor/default.aspx/{reactor_name}",
                    countryPageURLTemplate: "//www.world-nuclear.org/country/default.aspx/{country_name}",
                    searchPageURLTemplate: "//www.world-nuclear.org/information-library/facts-and-figures/reactor-database-data/reactor-database-search.aspx?source={query}",
                    reactorsBackground: "//world-nuclear.org/WNA/media/WNA/Furniture/General/iconReactor.svg",
                    underConstructionBackground: "//world-nuclear.org/WNA/media/WNA/Furniture/General/iconConstruction.svg",
                    shutdownBackground: "//world-nuclear.org/WNA/media/WNA/Furniture/General/iconShutdown.svg"
                });
            });
        </script>
</asp:Content>

