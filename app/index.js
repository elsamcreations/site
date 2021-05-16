import './style.css'
import { Sheet } from './component/sheet.js'

const couettes = [{"name":"101-dalmatians","info":"","photos":["dscn1392.jpg","dscn1393.jpg","dscn1394.jpg","dscn1395.jpg"],"createdAt":1620682234148.1243},{"name":"action-man","info":"Partly used","photos":["dscn1402.jpg","dscn1409.jpg","dscn1408.jpg","dscn1407.jpg","dscn1406.jpg","dscn1405.jpg","dscn1404.jpg","dscn1403.jpg"],"createdAt":1620681228887.5159},{"name":"ddp","info":"","photos":["dscn1397.jpg","dscn1398.jpg","dscn1399.jpg","dscn1400.jpg","dscn1401.jpg"],"createdAt":1620681873875.1963},{"name":"digimon","info":"","photos":["dscn1422.jpg","dscn1419.jpg","dscn1420.jpg","dscn1421.jpg"],"createdAt":1620681019507.3127},{"name":"disney-princess","info":"","photos":["dscn1425.jpg","dscn1426.jpg","dscn1423.jpg","dscn1424.jpg"],"createdAt":1620681041734.9175},{"name":"nemo","info":"","photos":["dscn1375.jpg","dscn1373.jpg","dscn1374.jpg","dscn1378.jpg","dscn1377.jpg","dscn1376.jpg"],"createdAt":1620683508653.344},{"name":"noddy","info":"","photos":["dscn1382.jpg","dscn1380.jpg","dscn1384.jpg","dscn1383.jpg","dscn1381.jpg"],"createdAt":1620683115200.3074},{"name":"om","info":"","photos":["dscn1412.jpg","dscn1410.jpg","dscn1411.jpg","dscn1413.jpg","dscn1414.jpg"],"createdAt":1620681166276.667},{"name":"pirate","info":"","photos":["dscn1418.jpg","dscn1417.jpg","dscn1415.jpg","dscn1416.jpg"],"createdAt":1620681110425.683},{"name":"teletubbies","info":"","photos":["dscn1372.jpg","dscn1369.jpg","dscn1370.jpg","dscn1371.jpg"],"createdAt":1620683420326.946},{"name":"tintin-3d","info":"","photos":["dscn1390.jpg","dscn1391.jpg","dscn1389.jpg"],"createdAt":1620682322430.3818},{"name":"winnie-the-pooh","info":"","photos":["dscn1388.jpg","dscn1385.jpg","dscn1386.jpg","dscn1387.jpg"],"createdAt":1620682867488.3577}]

document
  .querySelector('#sheets > div')
  .append(...couettes.map(Sheet))
