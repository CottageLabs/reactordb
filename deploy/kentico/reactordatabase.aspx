<%@ Page Title="" Language="C#" MasterPageFile="reactor.master" AutoEventWireup="true" CodeFile="reactordatabase.aspx.cs" Inherits="CMS_CMSTemplates_WNA_Basket" %>

<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolderHead" Runat="Server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="plcMain" Runat="Server">
    <div class="col-md-12 col-xs-12 genericContent">
        <div id="dashboard"></div>
    <cms:CMSPagePlaceholder ID="plcZones" runat="server">
    <LayoutTemplate>
        <cms:CMSWebPartZone ID="zContentZone" ZoneTitle="Content zone" runat="Server"></cms:CMSWebPartZone>
    </LayoutTemplate>
    </cms:CMSPagePlaceholder> 
    </div>
</asp:Content>
<asp:Content ID="Content3" ContentPlaceHolderID="ContentPlaceHolderScriptsFooter" Runat="Server">
        <script type="text/javascript">
            reactordb.makeDashboard({
                year: 2016,
                nuclearShareURL: "http://world-nuclear.org/WNA/media/WNA/Furniture/General/shareofgeneration.csv",
                reactorsBackground: "http://world-nuclear.org/WNA/media/WNA/Furniture/General/iconReactor.svg",
                underConstructionBackground: "http://world-nuclear.org/WNA/media/WNA/Furniture/General/iconConstruction.svg",
                reactorPageURLTemplate: "http://www.world-nuclear.org/reactor/default.aspx/{reactor_name}",
                countryPageURLTemplate: "http://www.world-nuclear.org/country/default.aspx/{country_name}",
                searchPageURL : "http://www.world-nuclear.org/information-library/facts-and-figures/reactor-database-data/reactor-database-search.aspx",
                reactor_search_url: "http://reactordb.world-nuclear.org/query/reactor/_search",
                operation_search_url: "http://reactordb.world-nuclear.org/query/operation/_search"
            });
    </script>
</asp:Content>

