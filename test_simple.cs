// Simple TorqueScript test - all 8 targets
function testBasic() {
   %a = 1;
   %b = 2;
   %c = %a + %b;
   return %c;
}

function testStrings() {
   %s1 = "hello";
   %s2 = "world";
   %s3 = %s1 @ " " @ %s2;
   return %s3;
}

function testIf() {
   %x = 5;
   if (%x > 3) { return 1; }
   else { return 0; }
}

function testLoop() {
   %sum = 0;
   for (%i = 0; %i < 10; %i++) {
      %sum = %sum + %i;
   }
   return %sum;
}

function testGlobal() {
   $g = 42;
   return $g;
}

function testFloat() {
   %pi = 3.14;
   return %pi * 2.0;
}

function testBitwise() {
   %a = 0x0F;
   %b = 0xF0;
   return %a | %b;
}

function testNot() {
   %x = 0;
   if (!%x) { return 1; }
   return 0;
}

function testTernary() {
   %x = 5;
   return (%x > 3) ? "big" : "small";
}
