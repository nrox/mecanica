ammo.idl allows to build ammo.js with [kripken/ammo.js](https://github.com/kripken/ammo.js)

##reference

Refer to [webidl ref](http://kripken.github.io/emscripten-site/docs/porting/connecting_cpp_and_javascript/WebIDL-Binder.html)

##discussion

[issue 60 in kripken/ammo.js](https://github.com/kripken/ammo.js/issues/60)

##examples

	<function>

		<bullet.h>
		<ammo.idl>

	btVector3.cross

        btVector3 cross (const btVector3 &v) const
		[Value] btVector3 cross([Const,Ref] btVector3 v);

	btMatrix3x3.setValue:

		void 	setValue (const btScalar &xx, const btScalar &xy, const btScalar &xz, 
				const btScalar &yx, const btScalar &yy, const btScalar &yz, 
				const btScalar &zx, const btScalar &zy, const btScalar &zz)

		void setValue (float xx, float xy, float xz, float yx, float yy, float yz, float zx, float zy, float zz);

