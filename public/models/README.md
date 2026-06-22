# /public/models

Slot dos modelos 3D (a "tesoura viva" e suas transformações).

- `tesoura.glb`
- `navalha.glb`
- `pente.glb`
- `maquina.glb`

Contrato: `.glb` binário, Draco, ≤ ~2–3 MB cada, texturas PBR ≤ 2K, Y-up,
mesma escala e mesmo pivô (centro) nos 4. Gerados via Meshy/Rodin (image-to-3D);
o Claude roda o cleanup (gltf-transform) antes de usar.
