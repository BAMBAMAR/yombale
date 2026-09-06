$csharp = @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public class NopalouIconGenerator
{
    private static GraphicsPath CreateSquirclePath(float x, float y, float w, float h, float r)
    {
        GraphicsPath path = new GraphicsPath();
        float d = r * 2.0f;
        path.AddArc(x, y, d, d, 180, 90);
        path.AddArc(x + w - d, y, d, d, 270, 90);
        path.AddArc(x + w - d, y + h - d, d, d, 0, 90);
        path.AddArc(x, y + h - d, d, d, 90, 90);
        path.CloseFigure();
        return path;
    }

    public static void Generate(int targetSize, string outputPath, string mode)
    {
        // Rendu en Super-Échantillonnage 2x (SSAA) : on dessine au double de la taille
        // puis on réduit en bicubique haute précision pour une netteté 'Retina Crystal Clear' (zéro flou)
        int renderSize = targetSize * 2;

        using (Bitmap renderBmp = new Bitmap(renderSize, renderSize, PixelFormat.Format32bppArgb))
        using (Graphics g = Graphics.FromImage(renderBmp))
        {
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.CompositingQuality = CompositingQuality.HighQuality;

            Color c1 = ColorTranslator.FromHtml("#FF7E22"); // Solaire éclatant
            Color c2 = ColorTranslator.FromHtml("#EA580C"); // Orange pur dynamique
            Color c3 = ColorTranslator.FromHtml("#C75B00"); // Terracotta officiel Nopalou
            Color c4 = ColorTranslator.FromHtml("#9E3C00"); // Ombre cuivrée profonde

            ColorBlend colorBlend = new ColorBlend();
            colorBlend.Colors = new Color[] { c1, c2, c3, c4 };
            colorBlend.Positions = new float[] { 0.0f, 0.35f, 0.70f, 1.0f };

            Color white = Color.White;

            if (mode == "apple")
            {
                // Mode Apple iOS : Fond plein 100% (iOS applique son propre squircle)
                using (LinearGradientBrush grad = new LinearGradientBrush(new PointF(0, 0), new PointF(renderSize, renderSize), c1, c4))
                {
                    grad.InterpolationColors = colorBlend;
                    g.FillRectangle(grad, 0, 0, renderSize, renderSize);
                }

                // Lueur interne de verre très fine et nette
                using (Pen sheenPen = new Pen(Color.FromArgb(55, 255, 255, 255), 3.0f))
                {
                    g.DrawRectangle(sheenPen, 2, 2, renderSize - 4, renderSize - 4);
                }

                float scale = 0.66f * ((float)renderSize / 512.0f);
                float offsetX = 87.04f * ((float)renderSize / 512.0f);
                float offsetY = 87.04f * ((float)renderSize / 512.0f);

                DrawCrispNMonogram(g, offsetX, offsetY, scale, white);
            }
            else
            {
                // Mode Splash Screen & PWA Android (Netteté absolue, zéro flou, zéro encoche noire) :
                // 1. Fond blanc pur (#FFFFFF) fusionnant à 100% avec le splash screen
                g.Clear(Color.White);

                // 2. Squircle aux angles nets et généreux (26% de courbure)
                float pad = (float)renderSize * 0.045f;
                float w = (float)renderSize - (pad * 2.0f);
                float h = (float)renderSize - (pad * 2.0f);
                float radius = w * 0.26f;

                // 3. Dessin du Squircle avec dégradé solaire éclatant (contour rasoir, net et sans bavure)
                using (GraphicsPath squirclePath = CreateSquirclePath(pad, pad, w, h, radius))
                using (LinearGradientBrush grad = new LinearGradientBrush(new PointF(pad, pad), new PointF(pad + w, pad + h), c1, c4))
                {
                    grad.InterpolationColors = colorBlend;
                    g.FillPath(grad, squirclePath);

                    // 4. Lueur interne supérieure (effet vitre polie / céramique luxueuse)
                    using (Pen sheenPen = new Pen(Color.FromArgb(70, 255, 255, 255), 3.5f * ((float)renderSize / 512.0f)))
                    {
                        sheenPen.Alignment = PenAlignment.Inset;
                        g.DrawPath(sheenPen, squirclePath);
                    }
                }

                // 5. Monogramme N officiel d'un blanc pur éclatant, avec des contours ultra-nets
                float scale = w / 512.0f;
                float offsetX = pad;
                float offsetY = pad;

                DrawCrispNMonogram(g, offsetX, offsetY, scale, white);
            }

            // Réduction bicubique haute fidélité vers la taille cible (anti-crénelage parfait)
            using (Bitmap finalBmp = new Bitmap(targetSize, targetSize, PixelFormat.Format32bppArgb))
            using (Graphics gFinal = Graphics.FromImage(finalBmp))
            {
                gFinal.SmoothingMode = SmoothingMode.HighQuality;
                gFinal.InterpolationMode = InterpolationMode.HighQualityBicubic;
                gFinal.PixelOffsetMode = PixelOffsetMode.HighQuality;
                gFinal.CompositingQuality = CompositingQuality.HighQuality;

                gFinal.DrawImage(renderBmp, new Rectangle(0, 0, targetSize, targetSize), 0, 0, renderSize, renderSize, GraphicsUnit.Pixel);
                finalBmp.Save(outputPath, ImageFormat.Png);
            }

            Console.WriteLine("Crystal-Clear generated: " + outputPath + " (" + targetSize + "x" + targetSize + ") [" + mode + "]");
        }
    }

    private static void DrawCrispNMonogram(Graphics g, float offsetX, float offsetY, float scale, Color color)
    {
        // Tracé mathématique pur du N, zéro ombre floue parasite pour une netteté 100% vectorielle
        using (GraphicsPath nPath = BuildNPath(offsetX, offsetY, scale))
        using (SolidBrush brush = new SolidBrush(color))
        {
            g.FillPath(brush, nPath);
        }
    }

    private static GraphicsPath BuildNPath(float offsetX, float offsetY, float scale)
    {
        GraphicsPath nPath = new GraphicsPath(FillMode.Alternate);

        // Rectangle principal
        float rx = offsetX + (120.0f * scale);
        float ry = offsetY + (108.0f * scale);
        float rw = 272.0f * scale;
        float rh = 296.0f * scale;
        nPath.AddRectangle(new RectangleF(rx, ry, rw, rh));

        // Découpe triangulaire supérieure
        PointF[] pts1 = new PointF[]
        {
            new PointF(offsetX + (324.0f * scale), offsetY + (108.0f * scale)),
            new PointF(offsetX + (188.0f * scale), offsetY + (108.0f * scale)),
            new PointF(offsetX + (324.0f * scale), offsetY + (306.0f * scale))
        };
        nPath.AddPolygon(pts1);

        // Découpe triangulaire inférieure
        PointF[] pts2 = new PointF[]
        {
            new PointF(offsetX + (188.0f * scale), offsetY + (404.0f * scale)),
            new PointF(offsetX + (324.0f * scale), offsetY + (404.0f * scale)),
            new PointF(offsetX + (188.0f * scale), offsetY + (206.0f * scale))
        };
        nPath.AddPolygon(pts2);

        return nPath;
    }
}
"@

Add-Type -TypeDefinition $csharp -ReferencedAssemblies System.Drawing

$baseDir = Split-Path -Parent $PSScriptRoot
$iconsDir = Join-Path $baseDir "frontend-next\public\icons"
$publicDir = Join-Path $baseDir "frontend-next\public"
$appDir = Join-Path $baseDir "frontend-next\src\app"

[NopalouIconGenerator]::Generate(1024, (Join-Path $iconsDir "icon-1024.png"), "standalone")
[NopalouIconGenerator]::Generate(512, (Join-Path $iconsDir "icon-512.png"), "standalone")
[NopalouIconGenerator]::Generate(192, (Join-Path $iconsDir "icon-192.png"), "standalone")
[NopalouIconGenerator]::Generate(512, (Join-Path $iconsDir "icon-maskable-512.png"), "standalone")
[NopalouIconGenerator]::Generate(1024, (Join-Path $iconsDir "icon-maskable-1024.png"), "standalone")
[NopalouIconGenerator]::Generate(180, (Join-Path $publicDir "apple-icon.png"), "apple")
[NopalouIconGenerator]::Generate(180, (Join-Path $appDir "apple-icon.png"), "apple")

Write-Output "ALL CRYSTAL-CLEAR RETINA PNG ICONS SUCCESSFULLY GENERATED!"
