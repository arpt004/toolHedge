CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_CategoryToSoftware" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

CREATE TABLE "_SoftwareToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");
CREATE UNIQUE INDEX "_CategoryToSoftware_AB_unique" ON "_CategoryToSoftware"("A", "B");
CREATE INDEX "_CategoryToSoftware_B_index" ON "_CategoryToSoftware"("B");
CREATE UNIQUE INDEX "_SoftwareToTag_AB_unique" ON "_SoftwareToTag"("A", "B");
CREATE INDEX "_SoftwareToTag_B_index" ON "_SoftwareToTag"("B");

ALTER TABLE "_CategoryToSoftware" ADD CONSTRAINT "_CategoryToSoftware_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CategoryToSoftware" ADD CONSTRAINT "_CategoryToSoftware_B_fkey" FOREIGN KEY ("B") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_SoftwareToTag" ADD CONSTRAINT "_SoftwareToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_SoftwareToTag" ADD CONSTRAINT "_SoftwareToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;