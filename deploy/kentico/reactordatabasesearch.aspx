<%@ Page Title="" Language="C#" MasterPageFile="reactor.master" AutoEventWireup="true" CodeFile="reactordatabase.aspx.cs" Inherits="CMS_CMSTemplates_WNA_Basket" %>

<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolderHead" Runat="Server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="plcMain" Runat="Server">
    <div class="col-md-12 col-xs-12 genericContent">
        <div id="reactor-search"></div>
    <cms:CMSPagePlaceholder ID="plcZones" runat="server">
    <LayoutTemplate>
        <cms:CMSWebPartZone ID="zContentZone" ZoneTitle="Content zone" runat="Server"></cms:CMSWebPartZone>
    </LayoutTemplate>
    </cms:CMSPagePlaceholder> 
    </div>
</asp:Content>
<asp:Content ID="Content3" ContentPlaceHolderID="ContentPlaceHolderScriptsFooter" Runat="Server">
        <script type="text/javascript">
            jQuery(document).ready(function ($) {
                reactordb.makeSearch({
                    search_url: "http://reactordb.world-nuclear.org/query/reactor/_search",
                    reactor_base_url: "http://www.world-nuclear.org/reactor/default.aspx/",
                    genericPageURLTemplate: "http://www.world-nuclear.org/generic?ref=search&source={query}"
                });
            });
    </script>
</asp:Content>

