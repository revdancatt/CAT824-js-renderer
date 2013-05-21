trace-depths {
  diff 4
  refl 3
  refr 2
}

gi {
   type ambocc
   bright { "sRGB nonlinear" 1 1 1 }
   dark { "sRGB nonlinear" 0 0 0 }
   samples 128
   maxdist 200.0
}

image {
  resolution 1000 1000
  aa 1 2
  filter gaussian
}

camera {
  type pinhole
  eye    0 -500 0
  target 0 0 0
  up     0 0 1
  fov    35
  aspect 1
}

background {
   color  { "sRGB nonlinear" 0.7 0.7 0.7 }
}

shader {
  name Grey
  type diffuse
  diff 0.7 0.7 0.7
}

shader {
  name Red
  type diffuse
  diff 0.8 0.0 0.0
}

shader {
  name DarkGrey
  type diffuse
  diff 0.2 0.2 0.2
}

shader {
   name Glossy
   type shiny
   diff 0.7 0.7 0.7
   refl 0.1
}

object {
   shader none
   type cornellbox
   corner0 -160  000 -160
   corner1  160  400  160
   left    0.30 0.30 0.30
   right   0.30 0.30 0.30
   top     0.30 0.30 0.30
   bottom  0.30 0.30 0.30
   back    0.30 0.30 0.30
   emit    2.5 2.5 2.5
   samples 32
}

object { 
   shader Grey 
   transform {
      rotatex -28
      rotatez 160
      scaleu 1.2
      translate 0 200 0
   }   
   type generic-mesh 
   name cobra

   points 15 
      32    76  0
     -32    76  0
       0    24  26
    -120    -8  -3
     120    -8  -3
     -88   -40  16
      88   -40  16
     128   -40  -8
    -128   -40  -8
       0   -40  26
     -32   -40 -24
      32   -40 -24
      -0.25 76   0
       0    86   0
    0.25    76   0

   triangles 22 
      0 1 2
      0 11 10
      0 10 1
      0 2 6
      0 6 4
      0 4 7
      0 7 11
      1 5 2
      1 3 5
      1 10 8
      1 8 3
      2 5 9
      2 9 6
      3 8 5
      4 6 7
      12 13 14
      12 14 13
      5 8 10
      5 10 9
      11 7 6
      11 6 9
      9 10 11

   normals none
   uvs none

}


